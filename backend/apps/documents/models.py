"""
Documents App - Models
=======================
Handles PDF uploads and text extraction.

Models:
- UploadedDocument: Stores metadata about an uploaded PDF
- DocumentChunk: Stores individual text chunks from a document
"""

import uuid
from django.db import models
from django.conf import settings


class UploadedDocument(models.Model):
    """
    Stores metadata about an uploaded PDF document.

    STATUS choices track the document's processing pipeline:
    UPLOADED -> EXTRACTING -> EXTRACTED -> CHUNKING -> PROCESSED -> FAILED
    """

    class Status(models.TextChoices):
        UPLOADED = 'uploaded', 'Uploaded'          # File saved, not yet processed
        EXTRACTING = 'extracting', 'Extracting'    # Text extraction in progress
        EXTRACTED = 'extracted', 'Text Extracted'  # Text extracted, ready for chunking
        CHUNKING = 'chunking', 'Chunking'          # Creating chunks
        PROCESSED = 'processed', 'Fully Processed' # Ready for quiz generation
        FAILED = 'failed', 'Processing Failed'     # Something went wrong

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Foreign key: links each document to the user who uploaded it
    # on_delete=CASCADE: if the user is deleted, their documents are also deleted
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',  # user.documents.all() gives all user's docs
        help_text="User who uploaded this document"
    )

    title = models.CharField(
        max_length=255,
        help_text="Document title (filename by default)"
    )

    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of the document"
    )

    # FileField stores the file and saves the path in the database
    # upload_to: files go to media/documents/user_<id>/
    file = models.FileField(
        upload_to='documents/',
        help_text="The uploaded PDF file"
    )

    file_size = models.PositiveBigIntegerField(
        default=0,
        help_text="File size in bytes"
    )

    file_name = models.CharField(
        max_length=255,
        help_text="Original filename"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED,
        db_index=True,  # Index for faster filtering by status
        help_text="Current processing status"
    )

    # Extracted text from the PDF (stored in DB for quick access)
    extracted_text = models.TextField(
        blank=True,
        null=True,
        help_text="Full text extracted from the PDF"
    )

    page_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of pages in the document"
    )

    # FAISS index ID for vector search
    faiss_index_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="ID of the FAISS vector index for this document"
    )

    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if processing failed"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),  # Speed up user+status queries
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.user.email})"

    @property
    def file_size_mb(self):
        """Return file size in megabytes."""
        return round(self.file_size / (1024 * 1024), 2)

    @property
    def is_processed(self):
        return self.status == self.Status.PROCESSED

    @property
    def is_failed(self):
        return self.status == self.Status.FAILED


class DocumentChunk(models.Model):
    """
    Stores individual text chunks from a document.

    WHY chunk?
    - AI models have token limits (can't process entire documents at once)
    - Smaller chunks allow more precise semantic search
    - Each chunk becomes a vector in FAISS for similarity search
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    document = models.ForeignKey(
        UploadedDocument,
        on_delete=models.CASCADE,
        related_name='chunks',
        help_text="The document this chunk belongs to"
    )

    chunk_index = models.PositiveIntegerField(
        help_text="Sequential index of this chunk within the document"
    )

    content = models.TextField(
        help_text="The text content of this chunk"
    )

    page_number = models.PositiveIntegerField(
        default=0,
        help_text="Page number in the original document"
    )

    # Metadata for retrieval context
    char_count = models.PositiveIntegerField(default=0)
    word_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_chunks'
        ordering = ['document', 'chunk_index']
        unique_together = [['document', 'chunk_index']]

    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.document.title}"
