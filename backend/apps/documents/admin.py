from django.contrib import admin
from .models import UploadedDocument, DocumentChunk


@admin.register(UploadedDocument)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'page_count', 'file_size_mb', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'user__email', 'file_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'extracted_text']
    ordering = ['-created_at']


@admin.register(DocumentChunk)
class ChunkAdmin(admin.ModelAdmin):
    list_display = ['document', 'chunk_index', 'word_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['document__title', 'content']
