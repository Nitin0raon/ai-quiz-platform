"""
Documents App - Serializers
"""

from rest_framework import serializers
from django.conf import settings
from .models import UploadedDocument, DocumentChunk


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for uploading a document.
    Validates file type and size.
    """

    class Meta:
        model = UploadedDocument
        fields = ['id', 'title', 'description', 'file']
        read_only_fields = ['id']

    def validate_file(self, value):
        """
        Validate the uploaded file:
        1. Must be a PDF
        2. Must be under size limit
        """
        # Check file type by MIME type
        if value.content_type not in ['application/pdf']:
            raise serializers.ValidationError(
                "Only PDF files are allowed. Please upload a .pdf file."
            )

        # Check file size
        max_size_bytes = settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024
        if value.size > max_size_bytes:
            raise serializers.ValidationError(
                f"File too large. Maximum allowed size is {settings.MAX_DOCUMENT_SIZE_MB}MB. "
                f"Your file is {round(value.size / (1024*1024), 1)}MB."
            )

        return value

    def create(self, validated_data):
        """Save document with additional metadata from the file."""
        file = validated_data['file']

        # If no title provided, use the filename (without extension)
        if not validated_data.get('title'):
            validated_data['title'] = file.name.rsplit('.', 1)[0]

        validated_data['file_size'] = file.size
        validated_data['file_name'] = file.name
        validated_data['user'] = self.context['request'].user

        return super().create(validated_data)


class DocumentListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing documents."""
    file_size_mb = serializers.ReadOnlyField()
    is_processed = serializers.ReadOnlyField()
    chunk_count = serializers.SerializerMethodField()

    class Meta:
        model = UploadedDocument
        fields = [
            'id', 'title', 'description', 'file_name',
            'file_size_mb', 'status', 'is_processed',
            'page_count', 'chunk_count', 'created_at'
        ]

    def get_chunk_count(self, obj):
        return obj.chunks.count()


class DocumentDetailSerializer(serializers.ModelSerializer):
    """Full serializer for a single document."""
    file_size_mb = serializers.ReadOnlyField()
    is_processed = serializers.ReadOnlyField()
    chunk_count = serializers.SerializerMethodField()

    class Meta:
        model = UploadedDocument
        fields = [
            'id', 'title', 'description', 'file', 'file_name',
            'file_size', 'file_size_mb', 'status', 'is_processed',
            'page_count', 'chunk_count', 'faiss_index_id',
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'page_count', 'faiss_index_id', 'error_message']

    def get_chunk_count(self, obj):
        return obj.chunks.count()
