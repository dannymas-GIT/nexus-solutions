from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import tempfile
import os
import logging
import json
import traceback
from typing import Dict, Any, List, Optional
import mimetypes # Added for file type detection

from ...services.document import get_document_service
from ...services.document.base import DocumentService
from ...services.storage import get_storage_service
from ...services.storage.base import StorageService

# Define base directories allowed for file access
ALLOWED_DIRS = ["marketing", "presentations"]
WORKSPACE_ROOT = Path("/opt/projects/NexusBusinessBuilder") # Adjust if needed

router = APIRouter(prefix="/documents", tags=["documents"])
logger = logging.getLogger(__name__)


@router.get("/templates")
async def list_templates(
    document_type: str = Query(..., description="Document type (docx, pptx, pdf)")
):
    """
    List available templates for a specific document type.
    
    Args:
        document_type: Type of document (docx, pptx, pdf)
    """
    try:
        document_service = get_document_service(document_type)
        templates = await document_service.list_templates()
        return {"templates": templates}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Failed to list templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{template_name}/schema")
async def get_template_schema(
    template_name: str,
    document_type: str = Query(..., description="Document type (docx, pptx, pdf)")
):
    """
    Get the data schema required for a specific template.
    
    Args:
        template_name: Name of the template
        document_type: Type of document (docx, pptx, pdf)
    """
    try:
        document_service = get_document_service(document_type)
        schema = await document_service.get_template_schema(template_name)
        return schema
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Template not found: {template_name}")
    except Exception as e:
        logger.exception(f"Failed to get template schema: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{template_name}/info")
async def get_template_info(
    template_name: str,
    document_type: str = Query(..., description="Document type (docx, pptx, pdf)")
):
    """
    Get information about a specific template.
    
    Args:
        template_name: Name of the template
        document_type: Type of document (docx, pptx, pdf)
    """
    try:
        document_service = get_document_service(document_type)
        info = await document_service.get_template_info(template_name)
        return info
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Template not found: {template_name}")
    except Exception as e:
        logger.exception(f"Failed to get template info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_document(
    template_name: str = Query(..., description="Name of the template to use"),
    document_type: str = Query(..., description="Document type (docx, pptx, pdf)"),
    storage_path: Optional[str] = Query(None, description="Path where to store the document in storage (relative to root folder)"),
    data: Dict[str, Any] = Body(..., description="Data to populate the template with"),
    document_service: DocumentService = Depends(lambda: get_document_service(None)),
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Generate a document from a template and data.
    
    Args:
        template_name: Name of the template to use
        document_type: Type of document (docx, pptx, pdf)
        storage_path: Path where to store the document in storage (relative to root folder)
        data: Data to populate the template with
    """
    try:
        # Log the start of the operation
        logger.info(f"Starting document generation: {template_name}.{document_type}")
        
        # Get the appropriate document service
        document_service = get_document_service(document_type)
        logger.info(f"Document service obtained: {document_service.__class__.__name__}")
        
        # Create a temporary directory for the output
        with tempfile.TemporaryDirectory() as temp_dir:
            logger.info(f"Created temporary directory: {temp_dir}")
            
            # Generate output filename
            temp_output_path = Path(temp_dir) / f"{template_name}_output.{document_type}"
            logger.info(f"Temporary output path: {temp_output_path}")
            
            try:
                # Generate the document
                logger.info(f"Generating document with data: {data}")
                output_file = await document_service.generate_document(
                    template_name=template_name,
                    data=data,
                    output_path=str(temp_output_path)
                )
                logger.info(f"Document generated: {output_file}")
                
                # Check if the file exists
                if not output_file.exists():
                    logger.error(f"Generated file does not exist: {output_file}")
                    raise FileNotFoundError(f"Generated file not found: {output_file}")
                
                # Upload to storage if storage_path is provided
                if storage_path:
                    logger.info(f"Uploading document to storage: {storage_path}")
                    file_url = await storage_service.upload_file(output_file, storage_path)
                    logger.info(f"Document uploaded to storage: {file_url}")
                    return {
                        "message": "Document generated and stored successfully",
                        "file_url": file_url,
                        "storage_path": storage_path
                    }
                else:
                    # Return the file
                    logger.info(f"Returning file directly: {output_file}")
                    return FileResponse(
                        path=output_file,
                        filename=output_file.name,
                        media_type=f"application/{document_type}"
                    )
            except Exception as e:
                logger.error(f"Error during document generation or storage: {str(e)}")
                logger.error(traceback.format_exc())
                raise e
    
    except FileNotFoundError as e:
        logger.exception(f"File not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logger.exception(f"Invalid value: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Failed to generate document: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# --- Helper Function to map extensions to frontend types ---
def get_frontend_file_type(extension: str) -> Optional[str]:
    ext = extension.lower()
    if ext == ".md":
        return "markdown"
    elif ext == ".html":
        return "html"
    elif ext == ".pdf":
        return "pdf"
    elif ext == ".pptx":
        return "pptx"
    elif ext == ".docx":
        return "docx"
    elif ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]:
        return "image"
    # Add other mappings as needed
    return None

# --- Recursive function to build file tree ---
def build_file_tree(dir_path: Path, allowed_root: Path) -> List[Dict[str, Any]]:
    tree = []
    try:
        for item in sorted(dir_path.iterdir()):
            # Security: Ensure we don't somehow escape the allowed root
            if allowed_root not in item.resolve().parents and item.resolve() != allowed_root:
                logger.warning(f"Skipping item outside allowed root during tree build: {item}")
                continue
                
            relative_path = str(item.relative_to(WORKSPACE_ROOT))
            node_name = item.name
            
            if item.is_dir():
                children = build_file_tree(item, allowed_root)
                if children: # Only include non-empty directories
                    tree.append({
                        "id": relative_path,
                        "name": node_name,
                        "type": "folder",
                        "children": children
                    })
            elif item.is_file():
                file_type = get_frontend_file_type(item.suffix)
                if file_type: # Only include files with recognized types
                    tree.append({
                        "id": relative_path,
                        "name": node_name,
                        "type": "file",
                        "fileType": file_type
                    })
            # Else: Skip other types like symlinks, etc.
    except OSError as e:
        logger.error(f"Error scanning directory {dir_path}: {e}")
    return tree

# --- New API Endpoint for File Tree ---
@router.get("/tree")
async def get_file_tree():
    """
    Get the file and folder structure for allowed directories 
    (marketing, presentations).
    """
    logger.info("==> API Request: /documents/tree")
    full_tree = []
    try:
        for dir_name in ALLOWED_DIRS:
            start_path = WORKSPACE_ROOT / dir_name
            if start_path.is_dir():
                # Build tree for this allowed directory
                dir_tree = build_file_tree(start_path, start_path)
                # Add the top-level directory itself if it has children
                if dir_tree:
                    full_tree.append({
                        "id": dir_name, 
                        "name": dir_name.capitalize(), # User-friendly name
                        "type": "folder",
                        "children": dir_tree
                    })
            else:
                logger.warning(f"Allowed directory not found or not a directory: {start_path}")
        
        return JSONResponse(content=full_tree)
    except Exception as e:
        logger.exception(f"Error building file tree: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while building file tree")


@router.get("/files/{file_path:path}")
async def get_file_content(file_path: str):
    """
    Get the content of a specific file within allowed directories.
    Validates the path to prevent access outside specified folders.

    Args:
        file_path: The relative path to the file from the workspace root 
                   (e.g., marketing/content/case_study.md).
    """
    # --- Logging incoming request ---
    logger.info(f"==> API Request: /files/{file_path}")

    try:
        # Construct the absolute path
        full_path = WORKSPACE_ROOT.joinpath(file_path).resolve()
        logger.info(f"    Resolved full path: {full_path}")

        # --- Security Check --- 
        # 1. Check if the resolved path is within the workspace root
        if WORKSPACE_ROOT not in full_path.parents and full_path != WORKSPACE_ROOT:
             logger.warning(f"    Access Denied (Outside Workspace): {full_path}")
             raise HTTPException(status_code=403, detail="Access denied: Path is outside workspace.")

        # 2. Check if the path starts with one of the allowed directories
        relative_path = full_path.relative_to(WORKSPACE_ROOT)
        logger.info(f"    Calculated relative path: {relative_path}") # Log relative path
        if not any(relative_path.is_relative_to(allowed_dir) for allowed_dir in ALLOWED_DIRS):
            logger.warning(f"    Access Denied (Outside Allowed Dirs): {relative_path}")
            raise HTTPException(status_code=403, detail="Access denied: Path is outside allowed directories.")
        
        # 3. Check if the file exists
        if not full_path.is_file():
            logger.warning(f"File not found at path: {full_path}")
            raise HTTPException(status_code=404, detail="File not found")

        # --- Read and Return Content (Handling Markdown for now) ---
        # Simple text reading for now, could be expanded based on MIME type
        if full_path.suffix.lower() == ".md":
            content = full_path.read_text(encoding='utf-8')
            logger.info(f"Successfully read markdown file: {full_path}")
            # Return as JSON for easy handling in frontend
            return JSONResponse(content={"content": content})
        else:
            # For other types, maybe return metadata or use FileResponse
            # For now, return unsupported for non-markdown
            logger.warning(f"Unsupported file type requested: {full_path.suffix}")
            raise HTTPException(status_code=415, detail=f"Unsupported file type: {full_path.suffix}")

    except HTTPException as http_exc: # Re-raise known HTTP exceptions
        raise http_exc
    except Exception as e:
        logger.exception(f"Error processing file request for {file_path}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while retrieving file") 