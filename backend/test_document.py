import os
import asyncio
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, '.')

from app.services.document import get_document_service
from app.services.storage import get_storage_service
from app.core.config import settings

# Print the current working directory
print(f"Current working directory: {os.getcwd()}")
print(f"Configured PDF template path: {settings.PDF_TEMPLATES_PATH}")
print(f"Absolute PDF template path: {Path(settings.PDF_TEMPLATES_PATH).resolve()}")

async def test_list_templates(document_type='pptx'):
    service = get_document_service(document_type)
    templates = await service.list_templates()
    print(f"{document_type.upper()} Templates: {templates}")
    return templates

async def test_generate_document(document_type='pdf'):
    service = get_document_service(document_type)
    data = {
        "business_name": "Test Company",
        "tagline": "Testing is our business",
        "business_description": "A test company for document generation. We specialize in creating test data for applications.",
        "contact_name": "Test Person",
        "contact_email": "test@example.com",
        "contact_phone": "555-1234",
        "target_market": "Test market",
        "market_size": "$1M",
        "market_growth": "10%",
        "year1_revenue": "$500K",
        "year3_revenue": "$2M",
        "breakeven_timeline": "12 months",
        "initial_investment": "$250K",
        "funding_strategy": "Bootstrap"
    }
    try:
        # Create output directory if it doesn't exist
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        
        template_name = "business_summary" if document_type == "pdf" else "business_plan"
        output_path = f"output/test_{template_name}.{document_type}"
        
        result = await service.generate_document(
            template_name=template_name,
            data=data,
            output_path=output_path
        )
        print(f"Generated document: {result}")
        return result
    except Exception as e:
        print(f"Error generating document: {e}")
        import traceback
        traceback.print_exc()
        return None

async def test_storage_service():
    storage_service = get_storage_service()
    print(f"Storage service: {storage_service.__class__.__name__}")
    
    try:
        # Check if the PDF file exists
        input_file = Path("output/test_business_summary.pdf")
        
        # If PDF doesn't exist, create a simple text file to test with
        if not input_file.exists():
            print(f"PDF file not found, creating a test file instead")
            test_file = Path("output/onedrive_test.txt")
            
            # Create output directory if it doesn't exist
            output_dir = Path("output")
            output_dir.mkdir(exist_ok=True)
            
            # Create a simple test file
            with open(test_file, "w") as f:
                f.write("This is a test file for OneDrive upload.")
            
            input_file = test_file
        
        print(f"Uploading file: {input_file}")
        # Use the same file extension as the input file for the destination
        file_name = f"test_file_{datetime.now().strftime('%Y%m%d%H%M%S')}{input_file.suffix}"
        
        file_url = await storage_service.upload_file(
            input_file, 
            file_name
        )
        print(f"File uploaded: {file_url}")
        
        # Ensure the root folder exists and list files
        print("\nListing files in OneDrive:")
        files = await storage_service.list_files("")
        print(f"Files in storage: {len(files)} found")
        for i, file in enumerate(files):
            print(f"{i+1}. {file.get('name')} ({file.get('webUrl', 'No URL')})")
        
        return file_url
    except Exception as e:
        print(f"Error testing storage service: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Generate PDF first
    print("Generating PDF document:")
    asyncio.run(test_generate_document('pdf'))
    
    # Then test OneDrive storage
    print("\nTesting OneDrive storage:")
    asyncio.run(test_storage_service()) 