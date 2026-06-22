"""
Documents App - Views
======================
Handles PDF upload and document management APIs.
"""

import logging
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from apps.common.pagination import StandardPagination
from apps.common.permissions import IsOwner
from .models import UploadedDocument
from .serializers import DocumentUploadSerializer, DocumentListSerializer, DocumentDetailSerializer
from .services import process_document_pipeline

logger = logging.getLogger('apps.documents')


class DocumentUploadView(APIView):
    """
    POST /api/v1/documents/upload/
    Upload a PDF document.

    MultiPartParser: Handles multipart/form-data (file uploads)
    FormParser: Handles form data alongside file uploads
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = DocumentUploadSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid file or data.',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            document = serializer.save()
        except Exception as e:
            logger.exception(f"Failed to save uploaded document for user {request.user.email}: {e}")
            return Response({
                'success': False,
                'message': 'Failed to save uploaded file. Check server logs for details.',
                'error': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.info(f"Document uploaded: {document.id} by user: {request.user.email}")

        # Process the document (extract text, chunk, embed)
        # In production with Celery, this would be: process_document.delay(document.id)
        # For now, we process it immediately (synchronously)
        try:
            pipeline_result = process_document_pipeline(document)
        except Exception as e:
            logger.exception(f"Document processing failed for {document.id}: {e}")
            document.status = document.Status.FAILED
            document.error_message = str(e)
            document.save(update_fields=['status', 'error_message', 'updated_at'])
            return Response({
                'success': False,
                'message': 'Document uploaded but processing failed. Check server logs for details.',
                'error': str(e),
                'document': DocumentDetailSerializer(document).data,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if pipeline_result['success']:
            message = (
                f"Document uploaded and processed successfully. "
                f"Extracted {pipeline_result.get('page_count', 0)} pages, "
                f"created {pipeline_result.get('chunks', 0)} chunks."
            )
        else:
            stage = pipeline_result.get('stage', 'processing')
            message = f"Document uploaded but processing failed at {stage} stage. Error: {pipeline_result.get('error')}"

        # Refresh from DB to get updated status
        document.refresh_from_db()

        return Response({
            'success': True,
            'message': message,
            'document': DocumentDetailSerializer(document).data,
        }, status=status.HTTP_201_CREATED)


class DocumentListView(generics.ListAPIView):
    """
    GET /api/v1/documents/
    List all documents for the current user.
    Supports pagination, search, and filtering.
    """
    serializer_class = DocumentListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    search_fields = ['title', 'file_name', 'description']
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return documents belonging to the current user."""
        return UploadedDocument.objects.filter(
            user=self.request.user
        ).prefetch_related('chunks')


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/v1/documents/<id>/  -> Get document details
    DELETE /api/v1/documents/<id>/  -> Delete document
    """
    serializer_class = DocumentDetailSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return UploadedDocument.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        title = document.title

        # Delete associated FAISS index if it exists
        if document.faiss_index_id:
            try:
                from apps.rag.services import FAISSService
                FAISSService().delete_index(document.faiss_index_id)
            except Exception as e:
                logger.warning(f"Failed to delete FAISS index for document {document.id}: {e}")

        document.delete()
        logger.info(f"Document deleted: {title} by user: {request.user.email}")

        return Response({
            'success': True,
            'message': f"Document '{title}' deleted successfully."
        }, status=status.HTTP_200_OK)


class DocumentReprocessView(APIView):
    """
    POST /api/v1/documents/<id>/reprocess/
    Re-run the processing pipeline on a failed document.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            document = UploadedDocument.objects.get(pk=pk, user=request.user)
        except UploadedDocument.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Document not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        if document.status == UploadedDocument.Status.PROCESSED:
            return Response({
                'success': False,
                'message': 'Document is already fully processed.'
            }, status=status.HTTP_400_BAD_REQUEST)

        pipeline_result = process_document_pipeline(document)
        document.refresh_from_db()

        return Response({
            'success': pipeline_result['success'],
            'message': 'Reprocessing complete.' if pipeline_result['success'] else f"Reprocessing failed: {pipeline_result.get('error')}",
            'document': DocumentDetailSerializer(document).data,
        })
