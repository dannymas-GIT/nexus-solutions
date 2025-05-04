import os
import json
import logging
import mimetypes
import tempfile
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from weasyprint.text.fonts import FontConfiguration
from weasyprint import HTML, CSS

from ...core.config import settings
from .base import DocumentService
from ..storage import get_storage_service

logger = logging.getLogger(__name__)

class PdfDocumentService(DocumentService):
    """Service for generating PDF documents."""
    
    def __init__(self):
        self.templates_path = Path(settings.PDF_TEMPLATES_PATH)
        self.storage_service = get_storage_service()
        
        # Ensure the templates directory exists
        self._ensure_templates_path_exists()
    
    def _ensure_templates_path_exists(self):
        """Ensure that the templates directory exists."""
        if not self.templates_path.exists():
            logger.info(f"Creating templates directory: {self.templates_path}")
            self.templates_path.mkdir(parents=True, exist_ok=True)
    
    def _get_template_path(self, template_name: str) -> Path:
        """Get the full path to a template configuration file."""
        template_path = self.templates_path / f"{template_name}.json"
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")
        return template_path
    
    def _get_schema_path(self, template_name: str) -> Path:
        """Get the path to a template's schema file."""
        schema_path = self.templates_path / f"{template_name}.schema.json"
        return schema_path
    
    def _get_info_path(self, template_name: str) -> Path:
        """Get the path to a template's info file."""
        info_path = self.templates_path / f"{template_name}.info.json"
        return info_path
    
    async def generate_document(
        self, 
        template_name: str, 
        data: Dict[str, Any], 
        output_path: Optional[str] = None
    ) -> Path:
        """
        Generate a PDF document from a template configuration and data.
        
        Args:
            template_name: Name of the template to use
            data: Data to populate the template with
            output_path: Optional path where to save the document
            
        Returns:
            Path to the generated document
        """
        template_path = self._get_template_path(template_name)
        
        # Load template configuration
        with open(template_path, "r") as f:
            template_config = json.load(f)
        
        # Create output filename if not provided
        if not output_path:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            output_path = f"pdfs/{template_name}_{timestamp}.pdf"
        
        # Ensure directories exist
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Create a PDF document
        document = SimpleDocTemplate(
            str(output_file),
            pagesize=letter,
            leftMargin=inch,
            rightMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = styles["Title"]
        heading_style = styles["Heading1"]
        subheading_style = styles["Heading2"]
        normal_style = styles["Normal"]
        
        # Build document content
        content = []
        
        # Process template sections
        for section in template_config.get("sections", []):
            section_type = section.get("type", "")
            section_content = section.get("content", "")
            
            if section_type == "title":
                # Replace placeholders in title
                for key, value in data.items():
                    placeholder = f"{{{{{key}}}}}"
                    if placeholder in section_content:
                        section_content = section_content.replace(placeholder, str(value))
                content.append(Paragraph(section_content, title_style))
                content.append(Spacer(1, 12))
            
            elif section_type == "heading":
                # Replace placeholders in heading
                for key, value in data.items():
                    placeholder = f"{{{{{key}}}}}"
                    if placeholder in section_content:
                        section_content = section_content.replace(placeholder, str(value))
                content.append(Paragraph(section_content, heading_style))
                content.append(Spacer(1, 12))
            
            elif section_type == "subheading":
                # Replace placeholders in subheading
                for key, value in data.items():
                    placeholder = f"{{{{{key}}}}}"
                    if placeholder in section_content:
                        section_content = section_content.replace(placeholder, str(value))
                content.append(Paragraph(section_content, subheading_style))
                content.append(Spacer(1, 6))
            
            elif section_type == "paragraph":
                # Replace placeholders in paragraph
                for key, value in data.items():
                    placeholder = f"{{{{{key}}}}}"
                    if placeholder in section_content:
                        section_content = section_content.replace(placeholder, str(value))
                content.append(Paragraph(section_content, normal_style))
                content.append(Spacer(1, 12))
            
            elif section_type == "table" and "rows" in section:
                # Process table
                table_data = []
                
                # Add header row if present
                if "header" in section:
                    header_row = []
                    for cell in section["header"]:
                        cell_content = cell
                        for key, value in data.items():
                            placeholder = f"{{{{{key}}}}}"
                            if placeholder in cell_content:
                                cell_content = cell_content.replace(placeholder, str(value))
                        header_row.append(Paragraph(cell_content, styles["Heading3"]))
                    table_data.append(header_row)
                
                # Process data rows
                for row in section["rows"]:
                    data_row = []
                    for cell in row:
                        cell_content = cell
                        for key, value in data.items():
                            placeholder = f"{{{{{key}}}}}"
                            if placeholder in cell_content:
                                cell_content = cell_content.replace(placeholder, str(value))
                        data_row.append(Paragraph(cell_content, normal_style))
                    table_data.append(data_row)
                
                # Create the table
                table = Table(table_data)
                
                # Apply table style
                style = TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ])
                table.setStyle(style)
                
                content.append(table)
                content.append(Spacer(1, 12))
        
        # Build the PDF
        document.build(content)
        logger.info(f"Generated PDF document: {output_file}")
        
        return output_file
    
    async def list_templates(self) -> List[Dict[str, Any]]:
        """
        List available PDF templates.
        
        Returns:
            List of template metadata
        """
        templates = []
        
        if not self.templates_path.exists():
            return templates
        
        for file_path in self.templates_path.glob("*.json"):
            if file_path.is_file() and not file_path.name.endswith((".schema.json", ".info.json")):
                template_name = file_path.stem
                
                # Try to get info from the info file
                info = await self.get_template_info(template_name)
                
                templates.append({
                    "name": template_name,
                    "file": file_path.name,
                    "type": "pdf",
                    "info": info
                })
        
        return templates
    
    async def get_template_info(self, template_name: str) -> Dict[str, Any]:
        """
        Get information about a specific template.
        
        Args:
            template_name: Name of the template
            
        Returns:
            Template metadata
        """
        info_path = self._get_info_path(template_name)
        
        # Default info
        info = {
            "name": template_name,
            "type": "pdf",
            "description": f"PDF template: {template_name}",
            "pages": 0
        }
        
        # Try to get info from the info file
        if info_path.exists():
            try:
                with open(info_path, "r") as f:
                    file_info = json.load(f)
                    info.update(file_info)
            except Exception as e:
                logger.error(f"Error reading template info file: {e}")
        
        return info
    
    async def get_template_schema(self, template_name: str) -> Dict[str, Any]:
        """
        Get the schema of data required for a specific template.
        
        Args:
            template_name: Name of the template
            
        Returns:
            JSON schema of the data required for the template
        """
        schema_path = self._get_schema_path(template_name)
        
        # Default schema
        schema = {
            "type": "object",
            "properties": {},
            "required": []
        }
        
        # Try to get schema from the schema file
        if schema_path.exists():
            try:
                with open(schema_path, "r") as f:
                    file_schema = json.load(f)
                    schema.update(file_schema)
            except Exception as e:
                logger.error(f"Error reading template schema file: {e}")
        else:
            # If no schema file exists, try to extract placeholders from the template
            try:
                template_path = self._get_template_path(template_name)
                
                with open(template_path, "r") as f:
                    template_config = json.load(f)
                
                # Find all placeholders in the template content
                placeholders = set()
                import re
                
                # Function to extract placeholders from text
                def extract_placeholders(text):
                    for match in re.finditer(r"{{([^}]+)}}", text):
                        placeholders.add(match.group(1))
                
                # Process each section in the template
                for section in template_config.get("sections", []):
                    if "content" in section:
                        extract_placeholders(section["content"])
                    
                    # Check table headers and rows
                    if section.get("type") == "table":
                        if "header" in section:
                            for cell in section["header"]:
                                extract_placeholders(cell)
                        
                        if "rows" in section:
                            for row in section["rows"]:
                                for cell in row:
                                    extract_placeholders(cell)
                
                # Create schema properties for each placeholder
                for placeholder in placeholders:
                    schema["properties"][placeholder] = {"type": "string"}
                    schema["required"].append(placeholder)
            
            except Exception as e:
                logger.error(f"Error extracting placeholders from template: {e}")
        
        return schema 