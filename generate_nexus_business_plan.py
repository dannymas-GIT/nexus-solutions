#!/usr/bin/env python3
import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.services.document import get_document_service
from app.services.storage import get_storage_service
from app.services.storage.onedrive import OneDriveStorageService

# Import the template creation script
from create_pptx_template import create_nexus_template

async def ensure_storage_ready():
    """Ensure the storage service is properly initialized."""
    storage_service = get_storage_service()
    
    # If it's an OneDrive storage service, ensure the root folder exists
    if isinstance(storage_service, OneDriveStorageService):
        print("Ensuring OneDrive root folder exists...")
        await storage_service._ensure_root_folder_exists()
    
    return storage_service

async def generate_business_plan_materials():
    """Generate all materials for the Nexus Solutions business plan."""
    
    print("=" * 80)
    print("NEXUS SOLUTIONS BUSINESS PLAN GENERATOR")
    print("=" * 80)
    print("Generating comprehensive business plan materials...")
    print()
    
    # First, create enhanced PowerPoint template
    print("Creating enhanced PowerPoint template...")
    pptx_template_path = create_nexus_template()
    print(f"Enhanced PowerPoint template created at: {pptx_template_path}")
    print()
    
    # Ensure storage is ready
    storage_service = await ensure_storage_ready()
    
    # Common data for all materials
    data = {
        "business_name": "Nexus Solutions",
        "tagline": "Where Data Converges, Insight Emerges",
        "current_date": datetime.now().strftime("%B %d, %Y"),
        "unique_value_proposition": "AI-powered data insights and recommendations with real-time visualization",
        
        # Financial projections
        "year1_revenue": "$2.5M",
        "year3_revenue": "$12M",
        "year5_revenue": "$30M",
        "year1_customers": "25",
        "year3_customers": "150",
        "year5_customers": "400",
        "year1_team_size": "15",
        "year3_team_size": "60",
        "year5_team_size": "120",
        "initial_investment": "$1.2M",
        "breakeven_timeline": "18 months",
        
        # Scaling strategy
        "scaling_dev_team": "Full-stack, data engineering, ML specialists",
        "scaling_ops_team": "DevOps, support, system administrators",
        "scaling_sales_team": "Industry-specific sales specialists and solution architects",
        
        # Go-to-market
        "mvp_timeline": "6 months",
        "funding_strategy": "Seed round followed by Series A in 18 months",
        
        # Contact information
        "contact_name": "Alex Johnson",
        "contact_email": "alex@nexussolutions.com",
        "contact_phone": "555-123-4567"
    }
    
    # Create output directory if it doesn't exist
    output_dir = Path("output/nexus_business_plan")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate PowerPoint presentation
    print("Generating PowerPoint presentation...")
    pptx_service = get_document_service('pptx')
    
    try:
        pptx_output_path = output_dir / "nexus_concept_presentation.pptx"
        pptx_result = await pptx_service.generate_document(
            template_name="nexus_concept_enhanced",
            data=data,
            output_path=str(pptx_output_path)
        )
        print(f"PowerPoint presentation generated successfully: {pptx_result}")
        
        # Upload to OneDrive
        onedrive_pptx_path = f"presentations/nexus_business_plan_{datetime.now().strftime('%Y%m%d')}.pptx"
        print(f"Uploading to OneDrive at path: {onedrive_pptx_path}")
        pptx_url = await storage_service.upload_file(pptx_result, onedrive_pptx_path)
        print(f"PowerPoint presentation uploaded successfully!")
        print(f"Access URL: {pptx_url}")
    except Exception as e:
        print(f"Error generating PowerPoint presentation: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    
    # Generate PDF document
    print("Generating PDF business overview...")
    pdf_service = get_document_service('pdf')
    
    try:
        pdf_output_path = output_dir / "nexus_business_overview.pdf"
        pdf_result = await pdf_service.generate_document(
            template_name="nexus_solutions",
            data=data, 
            output_path=str(pdf_output_path)
        )
        print(f"PDF generated successfully: {pdf_result}")
        
        # Upload to OneDrive
        onedrive_pdf_path = f"documents/nexus_business_plan_{datetime.now().strftime('%Y%m%d')}.pdf"
        print(f"Uploading to OneDrive at path: {onedrive_pdf_path}")
        pdf_url = await storage_service.upload_file(pdf_result, onedrive_pdf_path)
        print(f"PDF uploaded successfully!")
        print(f"Access URL: {pdf_url}")
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 80)
    print("Business plan materials generation complete!")
    print("=" * 80)
    print("Files generated:")
    print(f"1. PowerPoint Presentation: {pptx_output_path}")
    print(f"2. PDF Business Overview: {pdf_output_path}")
    print()
    print("Files uploaded to OneDrive:")
    print(f"1. PowerPoint: {onedrive_pptx_path}")
    print(f"2. PDF: {onedrive_pdf_path}")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(generate_business_plan_materials()) 