"""
RAG App - Views
Provides semantic search endpoint for testing/debugging.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.documents.models import UploadedDocument
from .services import FAISSService


class SemanticSearchView(APIView):
    """
    POST /api/v1/rag/search/
    Test semantic search on a document's FAISS index.
    Useful for debugging RAG retrieval quality.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        document_id = request.data.get('document_id')
        query = request.data.get('query', '').strip()
        top_k = int(request.data.get('top_k', 5))

        if not document_id or not query:
            return Response({
                'success': False,
                'message': 'document_id and query are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            document = UploadedDocument.objects.get(
                id=document_id,
                user=request.user
            )
        except UploadedDocument.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Document not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        if not document.faiss_index_id:
            return Response({
                'success': False,
                'message': 'Document has not been indexed yet. Reprocess it first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        faiss_service = FAISSService()
        results = faiss_service.search(document.faiss_index_id, query, top_k=top_k)

        return Response({
            'success': True,
            'query': query,
            'document': document.title,
            'result_count': len(results),
            'results': results,
        })
