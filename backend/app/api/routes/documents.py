from __future__ import annotations

import logging
import mimetypes
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse, Response

from ...core.config import settings
from ...core.dependencies import get_current_user
from ...services.document import get_document_service
from ...services.storage import get_storage_service
from .storage import require_admin_api_key

ALLOWED_DIRS = ["marketing", "presentations"]

MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    dependencies=[Depends(get_current_user)],
)
logger = logging.getLogger(__name__)


def _workspace_root() -> Path:
    env_root = (os.environ.get("NEXUS_WORKSPACE_ROOT") or "").strip()
    if env_root:
        return Path(env_root).resolve()
    return Path(settings.NEXUS_WORKSPACE_ROOT).resolve()


@router.get("/templates")
async def list_templates(
    document_type: str = Query(..., description="Document type (docx, pptx, pdf)")
):
    """List available templates for a specific document type."""
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
    document_type: str = Query(..., description="Document type (docx, pptx, pdf)"),
):
    """Get the data schema required for a specific template."""
    try:
        document_service = get_document_service(document_type)
        return await document_service.get_template_schema(template_name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Template not found: {template_name}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Failed to get template schema: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{template_name}/info")
async def get_template_info(
    template_name: str,
    document_type: str = Query(..., description="Document type (docx, pptx, pdf)"),
):
    """Get information about a specific template."""
    try:
        document_service = get_document_service(document_type)
        return await document_service.get_template_info(template_name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Template not found: {template_name}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Failed to get template info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_document(
    template_name: str = Query(..., description="Name of the template to use"),
    document_type: str = Query(..., description="Document type (docx, pptx, pdf)"),
    storage_path: Optional[str] = Query(
        None, description="Path where to store the document in storage (requires admin API key)"
    ),
    data: Dict[str, Any] = Body(..., description="Data to populate the template with"),
    x_admin_api_key: Optional[str] = Header(None, alias="X-Admin-Api-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """Generate a document from a template and data; streams bytes directly or uploads when authorized."""
    if storage_path:
        require_admin_api_key(x_admin_api_key=x_admin_api_key, authorization=authorization)

    doc_type = document_type.strip().lower()
    if doc_type not in MEDIA_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported document_type: {document_type}")

    safe_template = Path(template_name).name
    if safe_template != template_name or ".." in template_name:
        raise HTTPException(status_code=400, detail="Invalid template_name")

    try:
        document_service = get_document_service(doc_type)

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_output_path = Path(temp_dir) / f"{safe_template}_output.{doc_type}"
            output_file = await document_service.generate_document(
                template_name=safe_template,
                data=data,
                output_path=str(temp_output_path),
            )

            if not output_file.exists():
                raise FileNotFoundError(f"Generated file not found: {output_file}")

            if storage_path:
                storage_service = get_storage_service()
                file_url = await storage_service.upload_file(output_file, storage_path)
                return {
                    "message": "Document generated and stored successfully",
                    "file_url": file_url,
                    "storage_path": storage_path,
                }

            # Read bytes before TemporaryDirectory exits so streaming never hits a deleted file
            content = output_file.read_bytes()
            return Response(
                content=content,
                media_type=MEDIA_TYPES[doc_type],
                headers={"Content-Disposition": f'attachment; filename="{output_file.name}"'},
            )
    except HTTPException:
        raise
    except FileNotFoundError as e:
        logger.exception(f"File not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logger.exception(f"Invalid value: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Failed to generate document: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


def get_frontend_file_type(extension: str) -> Optional[str]:
    ext = extension.lower()
    if ext == ".md":
        return "markdown"
    if ext == ".html":
        return "html"
    if ext == ".pdf":
        return "pdf"
    if ext == ".pptx":
        return "pptx"
    if ext == ".docx":
        return "docx"
    if ext in (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"):
        return "image"
    return None


def build_file_tree(dir_path: Path, allowed_root: Path, workspace_root: Path) -> List[Dict[str, Any]]:
    tree: List[Dict[str, Any]] = []
    try:
        for item in sorted(dir_path.iterdir()):
            resolved = item.resolve()
            if not resolved.is_relative_to(allowed_root):
                logger.warning(f"Skipping item outside allowed root during tree build: {item}")
                continue

            relative_path = str(item.relative_to(workspace_root))
            node_name = item.name

            if item.is_dir():
                children = build_file_tree(item, allowed_root, workspace_root)
                if children:
                    tree.append(
                        {
                            "id": relative_path,
                            "name": node_name,
                            "type": "folder",
                            "children": children,
                        }
                    )
            elif item.is_file():
                file_type = get_frontend_file_type(item.suffix)
                if file_type:
                    tree.append(
                        {
                            "id": relative_path,
                            "name": node_name,
                            "type": "file",
                            "fileType": file_type,
                        }
                    )
    except OSError as e:
        logger.error(f"Error scanning directory {dir_path}: {e}")
    return tree


@router.get("/tree")
async def get_file_tree():
    """Get the file and folder structure for allowed directories (marketing, presentations)."""
    workspace_root = _workspace_root()
    full_tree: List[Dict[str, Any]] = []
    try:
        for dir_name in ALLOWED_DIRS:
            start_path = (workspace_root / dir_name).resolve()
            if start_path.is_dir() and start_path.is_relative_to(workspace_root):
                dir_tree = build_file_tree(start_path, start_path, workspace_root)
                if dir_tree:
                    full_tree.append(
                        {
                            "id": dir_name,
                            "name": dir_name.capitalize(),
                            "type": "folder",
                            "children": dir_tree,
                        }
                    )
            else:
                logger.warning(f"Allowed directory not found: {start_path}")

        return JSONResponse(content=full_tree)
    except Exception as e:
        logger.exception(f"Error building file tree: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while building file tree")


@router.get("/files/{file_path:path}")
async def get_file_content(file_path: str):
    """Get content of a file within allowed directories (marketing, presentations)."""
    workspace_root = _workspace_root()
    try:
        full_path = (workspace_root / file_path).resolve()
        if not full_path.is_relative_to(workspace_root):
            raise HTTPException(status_code=403, detail="Access denied: Path is outside workspace.")

        relative_path = full_path.relative_to(workspace_root)
        if not any(relative_path.is_relative_to(allowed_dir) for allowed_dir in ALLOWED_DIRS):
            raise HTTPException(status_code=403, detail="Access denied: Path is outside allowed directories.")

        if not full_path.is_file():
            raise HTTPException(status_code=404, detail="File not found")

        ext = full_path.suffix.lower()
        if ext in (".md", ".html"):
            content = full_path.read_text(encoding="utf-8")
            return JSONResponse(content={"content": content})

        if get_frontend_file_type(ext) is not None:
            media_type, _ = mimetypes.guess_type(str(full_path))
            return FileResponse(path=full_path, filename=full_path.name, media_type=media_type or "application/octet-stream")

        raise HTTPException(status_code=415, detail=f"Unsupported file type: {full_path.suffix}")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing file request for {file_path}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while retrieving file")
