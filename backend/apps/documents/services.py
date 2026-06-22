"""
Documents App - Service Layer
================================
Service functions contain business logic.
This keeps views thin and logic reusable.

WHY a service layer?
- Views should only handle HTTP (request/response)
- Complex logic goes in services
- Services are easier to test
- Can be reused across multiple views
"""

import os
import logging
import pdfplumber
import tempfile
import requests
from django.conf import settings
from .models import UploadedDocument, DocumentChunk

logger = logging.getLogger('apps.documents')


class PDFExtractionService:
    """
    Handles PDF text extraction using pdfplumber.

    pdfplumber is excellent for:
    - Extracting text from text-based PDFs
    - Reading tables
    - Getting text by page

    Note: It cannot extract text from scanned/image PDFs (need OCR for that).
    """
    def extract_text(self, document: UploadedDocument, file_obj=None, file_bytes=None) -> dict:
        """
        Extract text from a PDF document. Accepts an optional `file_obj` which is the
        original uploaded file (an InMemoryUploadedFile). If provided, that will be
        used in preference to reading from storage or downloading remote copies.
        """
        try:
            document.status = UploadedDocument.Status.EXTRACTING
            document.save(update_fields=['status'])

            # Prefer original uploaded file if passed in
            temp_downloaded = False
            file_like = None

            # If raw bytes were provided (from upload), prefer them
            import io as _io
            if file_bytes is not None:
                file_like = _io.BytesIO(file_bytes)
            elif file_obj is not None:
                file_bytes_local = file_obj.read()
                try:
                    file_obj.close()
                except Exception:
                    pass
                file_like = _io.BytesIO(file_bytes_local)
            else:
                # Try filesystem path first
                file_path = None
                try:
                    file_path = document.file.path
                except Exception:
                    file_path = None

                if not file_path or not os.path.exists(file_path):
                    # Try storage open
                    try:
                        storage_file = document.file.open('rb')
                        import io as _io
                        file_like = _io.BytesIO(storage_file.read())
                        try:
                            storage_file.close()
                        except Exception:
                            pass
                    except Exception:
                        # Fallback: attempt HTTP download of file URL
                        file_url = getattr(document.file, 'url', None)
                        if not file_url:
                            raise ValueError("Document file path unavailable and no URL present for download.")
                        resp = requests.get(file_url, stream=True, timeout=30)
                        if resp.status_code != 200:
                            raise ValueError(f"Failed to download file for processing (status={resp.status_code})")
                        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
                        try:
                            for chunk in resp.iter_content(chunk_size=8192):
                                if chunk:
                                    tmp.write(chunk)
                            tmp.flush()
                        finally:
                            tmp.close()
                        file_path = tmp.name
                        temp_downloaded = True

            # Open with pdfplumber using either file_like or file_path and try to extract.
            extracted_pages = []
            page_count = 0

            try:
                if file_like is not None:
                    pdf_ctx = pdfplumber.open(file_like)
                else:
                    pdf_ctx = pdfplumber.open(file_path)

                with pdf_ctx as pdf:
                    page_count = len(pdf.pages)
                    for page_num, page in enumerate(pdf.pages, start=1):
                        text = page.extract_text()
                        if text:
                            cleaned_text = self._clean_text(text)
                            if cleaned_text:
                                extracted_pages.append({'page': page_num, 'text': cleaned_text})

                if not extracted_pages:
                    raise ValueError("No text extracted with pdfplumber; will try pypdf fallback.")

            except Exception as e_pdfplumber:
                logger.warning(f"pdfplumber extraction failed for {document.id}: {e_pdfplumber}. Trying pypdf fallback.")

                # Attempt fallback extraction using pypdf / PyPDF2
                try:
                    from importlib import util as _util
                    if _util.find_spec('pypdf'):
                        from pypdf import PdfReader
                    elif _util.find_spec('PyPDF2'):
                        from PyPDF2 import PdfReader
                    else:
                        raise ImportError('No pypdf/PyPDF2 available for fallback')

                    # Obtain bytes for PdfReader
                    if file_like is not None:
                        pdf_bytes = file_like.getvalue()
                    else:
                        with open(file_path, 'rb') as fh:
                            pdf_bytes = fh.read()

                    reader = PdfReader(io.BytesIO(pdf_bytes))
                    page_count = len(reader.pages)
                    for page_num, p in enumerate(reader.pages, start=1):
                        try:
                            text = p.extract_text()
                        except Exception:
                            text = None
                        if text:
                            cleaned_text = self._clean_text(text)
                            if cleaned_text:
                                extracted_pages.append({'page': page_num, 'text': cleaned_text})

                    if not extracted_pages:
                        raise ValueError('Fallback pypdf extraction produced no text')

                except Exception as e_fallback:
                    # Re-raise a combined error for clarity
                    raise ValueError(f"pdfplumber error: {e_pdfplumber}; pypdf fallback error: {e_fallback}")

            full_text = '\n\n'.join([f"[Page {p['page']}]\n{p['text']}" for p in extracted_pages])

            document.extracted_text = full_text
            document.page_count = page_count
            document.status = UploadedDocument.Status.EXTRACTED
            document.save(update_fields=['extracted_text', 'page_count', 'status'])

            logger.info(f"Text extraction complete for document {document.id}. Pages: {page_count}, Characters: {len(full_text)}")

            # Cleanup temporary downloaded file if used
            if temp_downloaded:
                try:
                    os.remove(file_path)
                except Exception:
                    logger.warning(f"Could not remove temp file {file_path} for document {document.id}")

            return {'success': True, 'text': full_text, 'page_count': page_count, 'pages': extracted_pages, 'error': None}

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Text extraction failed for document {document.id}: {error_msg}")
            document.status = UploadedDocument.Status.FAILED
            document.error_message = error_msg
            document.save(update_fields=['status', 'error_message'])

            # Cleanup temporary downloaded file if used
            try:
                if 'temp_downloaded' in locals() and temp_downloaded and file_path and os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                logger.warning(f"Could not remove temp file {file_path} after failure for document {document.id}")

            return {'success': False, 'text': None, 'page_count': 0, 'pages': [], 'error': error_msg}

    def _clean_text(self, text: str) -> str:
        """
        Clean extracted text by removing unwanted characters.
        """
        if not text:
            return ''

        # Replace multiple whitespace/newlines with single ones
        import re
        text = re.sub(r'\n{3,}', '\n\n', text)      # Max 2 newlines
        text = re.sub(r' {2,}', ' ', text)            # Max 1 space
        text = re.sub(r'[^\x00-\x7F]+', ' ', text)   # Remove non-ASCII (optional)
        text = text.strip()

        return text


class DocumentChunkingService:
    """
    Splits extracted text into chunks for embedding generation.

    WHY chunk?
    - Gemini/GPT have context limits (e.g. 32K tokens)
    - Smaller chunks = more precise retrieval
    - We can find the EXACT paragraph relevant to a question

    Chunking strategy:
    - chunk_size: How many characters per chunk
    - chunk_overlap: How many characters to share between consecutive chunks
    - Overlap ensures context isn't lost at chunk boundaries
    """

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def create_chunks(self, document: UploadedDocument) -> dict:
        """
        Split document text into chunks and save to database.

        Args:
            document: UploadedDocument with extracted_text

        Returns:
            dict with 'success', 'chunks', 'count', 'error'
        """
        try:
            if not document.extracted_text:
                raise ValueError("Document has no extracted text to chunk.")

            document.status = UploadedDocument.Status.CHUNKING
            document.save(update_fields=['status'])

            # Use LangChain's text splitter
            from langchain.text_splitter import RecursiveCharacterTextSplitter

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                # Split on these separators, in order of preference
                separators=['\n\n', '\n', '. ', ' ', ''],
                length_function=len,
            )

            text_chunks = splitter.split_text(document.extracted_text)

            if not text_chunks:
                raise ValueError("Text splitting produced no chunks.")

            # Delete any existing chunks for this document (re-processing case)
            DocumentChunk.objects.filter(document=document).delete()

            # Save chunks to database
            chunk_objects = []
            for index, chunk_text in enumerate(text_chunks):
                chunk_objects.append(DocumentChunk(
                    document=document,
                    chunk_index=index,
                    content=chunk_text,
                    char_count=len(chunk_text),
                    word_count=len(chunk_text.split()),
                ))

            # bulk_create is much faster than individual .save() calls
            DocumentChunk.objects.bulk_create(chunk_objects)

            document.status = UploadedDocument.Status.PROCESSED
            document.save(update_fields=['status'])

            logger.info(
                f"Created {len(chunk_objects)} chunks for document {document.id}"
            )

            return {
                'success': True,
                'chunks': text_chunks,
                'count': len(text_chunks),
                'error': None
            }

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Chunking failed for document {document.id}: {error_msg}")

            document.status = UploadedDocument.Status.FAILED
            document.error_message = error_msg
            document.save(update_fields=['status', 'error_message'])

            return {
                'success': False,
                'chunks': [],
                'count': 0,
                'error': error_msg
            }


def process_document_pipeline(document: UploadedDocument, file_obj=None, file_bytes=None) -> dict:
    """
    Run the full document processing pipeline:
    1. Extract text from PDF
    2. Chunk the text
    3. Generate embeddings and store in FAISS (from rag app)

    This is called after a document is uploaded.
    In production, this would be a background task (Celery).
    For now, we run it synchronously.
    """
    logger.info(f"Starting full processing pipeline for document: {document.id}")

    # Step 1: Extract text
    extractor = PDFExtractionService()
    extraction_result = extractor.extract_text(document, file_obj=file_obj, file_bytes=file_bytes)

    if not extraction_result['success']:
        return {'success': False, 'error': extraction_result['error'], 'stage': 'extraction'}

    # Step 2: Chunk text
    chunker = DocumentChunkingService()
    chunking_result = chunker.create_chunks(document)

    if not chunking_result['success']:
        return {'success': False, 'error': chunking_result['error'], 'stage': 'chunking'}

    # Step 3: Generate embeddings (RAG pipeline)
    try:
        from apps.rag.services import FAISSService
        faiss_service = FAISSService()
        embedding_result = faiss_service.index_document(document)

        if not embedding_result['success']:
            logger.warning(
                f"Embedding failed for document {document.id}: {embedding_result['error']}"
            )
            # Don't fail the whole pipeline if embedding fails
            # Document is still usable for quiz generation with text alone

    except Exception as e:
        logger.warning(f"RAG pipeline error for document {document.id}: {e}")

    logger.info(f"Processing pipeline complete for document: {document.id}")
    return {
        'success': True,
        'chunks': chunking_result['count'],
        'page_count': extraction_result['page_count'],
    }
