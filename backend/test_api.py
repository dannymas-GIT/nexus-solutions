import json
import requests
import sys
from pathlib import Path

# Base URL of the API
BASE_URL = "http://localhost:8000/api/v1/documents"

def list_templates(document_type):
    """List available templates for a document type."""
    response = requests.get(f"{BASE_URL}/templates", params={"document_type": document_type})
    if response.status_code == 200:
        print(f"\n{document_type.upper()} Templates:")
        templates = response.json()["templates"]
        for template in templates:
            print(f"- {template['name']}: {template['info']['description']}")
        return templates
    else:
        print(f"Error listing templates: {response.status_code} - {response.text}")
        return []

def get_template_schema(template_name, document_type):
    """Get the schema for a specific template."""
    response = requests.get(
        f"{BASE_URL}/templates/{template_name}/schema", 
        params={"document_type": document_type}
    )
    if response.status_code == 200:
        schema = response.json()
        print(f"\nSchema for {template_name}:")
        print(f"Required fields: {schema.get('required', [])}")
        return schema
    else:
        print(f"Error getting schema: {response.status_code} - {response.text}")
        return None

def generate_document(template_name, document_type, data, storage_path=None):
    """Generate a document from a template and data."""
    params = {
        "template_name": template_name,
        "document_type": document_type
    }
    
    if storage_path:
        params["storage_path"] = storage_path
    
    print(f"\nGenerating {document_type} document from {template_name} template...")
    
    response = requests.post(
        f"{BASE_URL}/generate",
        params=params,
        json=data
    )
    
    if response.status_code == 200:
        if storage_path:
            # Document was stored in storage
            result = response.json()
            print(f"Document generated and stored successfully!")
            print(f"File URL: {result['file_url']}")
            print(f"Storage path: {result['storage_path']}")
            return result
        else:
            # Document is returned directly
            print(f"Document generated successfully!")
            # Save the document locally
            output_path = f"{template_name}_output.{document_type}"
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"Document saved to: {output_path}")
            return output_path
    else:
        print(f"Error generating document: {response.status_code} - {response.text}")
        return None

def main():
    # Sample business data
    data = {
        "business_name": "Acme Innovations",
        "tagline": "Building the Future Today",
        "business_description": "Acme Innovations creates cutting-edge software solutions for businesses of all sizes. Our products help companies streamline operations, reduce costs, and improve customer satisfaction.",
        "contact_name": "Jane Smith",
        "contact_email": "jane@acmeinnovations.com",
        "contact_phone": "555-123-4567",
        "target_market": "Small to medium-sized businesses",
        "market_size": "$5B",
        "market_growth": "15% annually",
        "year1_revenue": "$1.2M",
        "year3_revenue": "$5M",
        "breakeven_timeline": "18 months",
        "initial_investment": "$500K",
        "funding_strategy": "Angel investors and bootstrapping"
    }
    
    # List available templates
    pdf_templates = list_templates("pdf")
    
    if not pdf_templates:
        print("No PDF templates available.")
        return
    
    # Choose the first template
    template = pdf_templates[0]
    
    # Get the schema for the template
    schema = get_template_schema(template["name"], "pdf")
    
    # Generate document with storage
    result = generate_document(
        template_name=template["name"],
        document_type="pdf",
        data=data,
        storage_path=f"generated/{template['name']}_{data['business_name'].replace(' ', '_')}.pdf"
    )
    
    # Generate document without storage (direct download)
    result = generate_document(
        template_name=template["name"],
        document_type="pdf",
        data=data
    )

if __name__ == "__main__":
    main() 