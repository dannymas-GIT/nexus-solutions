import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.services.document import get_document_service
from app.services.storage import get_storage_service

async def generate_nexus_concept():
    """Generate a PPTX presentation for the Nexus Solutions business concept."""
    
    # Get the PPTX document service
    document_service = get_document_service('pptx')
    
    # Define template data
    data = {
        "business_name": "Nexus Solutions",
        "tagline": "The Central Connection for All Your Data Needs",
        "current_date": datetime.now().strftime("%B %d, %Y"),
        "unique_value_proposition": "AI-powered data insights and recommendations",
        
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
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    
    # Define output path for the presentation
    output_path = "output/nexus_concept_presentation.pptx"
    
    print(f"Generating Nexus concept presentation...")
    try:
        # Generate the document
        result = await document_service.generate_document(
            template_name="nexus_concept",
            data=data,
            output_path=output_path
        )
        print(f"Presentation generated successfully: {result}")
        
        # Upload to OneDrive
        storage_service = get_storage_service()
        onedrive_path = f"presentations/nexus_concept_{datetime.now().strftime('%Y%m%d')}.pptx"
        
        print(f"Uploading to OneDrive at path: {onedrive_path}")
        file_url = await storage_service.upload_file(result, onedrive_path)
        print(f"Presentation uploaded successfully!")
        print(f"Access URL: {file_url}")
        
        return file_url
    except Exception as e:
        print(f"Error generating presentation: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    asyncio.run(generate_nexus_concept()) 