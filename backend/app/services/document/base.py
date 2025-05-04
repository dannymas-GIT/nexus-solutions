from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List, Optional


class DocumentService(ABC):
    """Base abstract class for document generation services."""
    
    @abstractmethod
    async def generate_document(
        self, 
        template_name: str, 
        data: Dict[str, Any], 
        output_path: Optional[str] = None
    ) -> Path:
        """
        Generate a document from a template and data.
        
        Args:
            template_name: Name of the template to use
            data: Data to populate the template with
            output_path: Optional path where to save the document, relative to the configured output directory
            
        Returns:
            Path to the generated document
        """
        pass
    
    @abstractmethod
    async def list_templates(self) -> List[Dict[str, Any]]:
        """
        List available templates.
        
        Returns:
            List of template metadata
        """
        pass
    
    @abstractmethod
    async def get_template_info(self, template_name: str) -> Dict[str, Any]:
        """
        Get information about a specific template.
        
        Args:
            template_name: Name of the template
            
        Returns:
            Template metadata
        """
        pass
    
    @abstractmethod
    async def get_template_schema(self, template_name: str) -> Dict[str, Any]:
        """
        Get the schema of data required for a specific template.
        
        Args:
            template_name: Name of the template
            
        Returns:
            JSON schema of the data required for the template
        """
        pass 