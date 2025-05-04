from typing import Optional
from ...core.config import settings
from .base import DocumentService
from .docx import DocxDocumentService
from .pptx import PptxDocumentService
from .pdf import PdfDocumentService

_document_service: Optional[DocumentService] = None


def get_document_service(document_type: str = None) -> DocumentService:
    """
    Factory function to get the appropriate document service based on document type.
    
    Args:
        document_type: The type of document to generate (docx, pptx, pdf)
        
    Returns:
        An instance of the appropriate DocumentService
    """
    global _document_service
    
    # If no specific type is requested, return the cached service
    if document_type is None and _document_service is not None:
        return _document_service
    
    if document_type == "docx":
        return DocxDocumentService()
    elif document_type == "pptx":
        return PptxDocumentService()
    elif document_type == "pdf":
        return PdfDocumentService()
    else:
        raise ValueError(f"Unknown document type: {document_type}") 