#!/usr/bin/env python3
"""
Script to convert entrepreneur information form data to YAML configuration file.
This would be used to process the Word document form submission.
"""
import yaml
import datetime
import os
import argparse
from typing import Dict, Any, List, Optional

class EntrepreneurFormProcessor:
    def __init__(self, data: Dict[str, Any]):
        """Initialize with form data."""
        self.data = data
        self.config = {}
    
    def process(self) -> Dict[str, Any]:
        """Process the form data into a structured configuration."""
        # Basic information
        self.config["idea_id"] = self._generate_idea_id()
        self.config["brand_name"] = self.data.get("business_name", "")
        self.config["tagline"] = self.data.get("tagline", "")
        self.config["submission_date"] = self.data.get("submission_date", 
                                                    datetime.datetime.now().strftime("%Y-%m-%d"))
        
        # Founder information
        self.config["founders"] = self._process_founders()
        
        # Market information
        self.config["market_focus"] = self.data.get("target_market", "")
        self.config["geographical_focus"] = self.data.get("geographical_focus", "")
        
        # Customer segments
        self.config["customer_segments"] = self.data.get("customer_segments", "").split(",")
        
        # Competitive landscape
        self.config["competitors"] = self._process_competitors()
        
        # Product/Service offering
        self.config["offering"] = self._process_offering()
        
        # Business model
        self.config["business_model"] = {
            "revenue_streams": self.data.get("revenue_streams", "").split(","),
            "sales_channels": self.data.get("sales_channels", "").split(","),
            "acquisition_strategy": self.data.get("acquisition_strategy", ""),
            "retention_strategy": self.data.get("retention_strategy", ""),
            "key_partnerships": self.data.get("key_partnerships", "").split(",")
        }
        
        # Financial projections
        self.config["financials"] = {
            "initial_investment": self._convert_to_float(self.data.get("initial_investment", "0")),
            "monthly_costs": self._convert_to_float(self.data.get("monthly_costs", "0")),
            "breakeven_timeline_months": self._convert_to_int(self.data.get("breakeven_timeline", "0")),
            "funding_strategy": self.data.get("funding_strategy", "")
        }
        
        # Goals
        self.config["goals"] = {
            "launch_date": self.data.get("launch_date", ""),
            "year_1": {
                "revenue_usd": self._convert_to_float(self.data.get("year1_revenue", "0")),
                "description": self.data.get("year1_goals", "")
            },
            "year_3": {
                "revenue_usd": self._convert_to_float(self.data.get("year3_revenue", "0")),
                "vision": self.data.get("year3_vision", "")
            },
            "milestones": [
                {
                    "description": self.data.get("milestone1_desc", ""),
                    "target_date": self.data.get("milestone1_date", "")
                }
            ]
        }
        
        # Operations
        self.config["operations"] = {
            "location_needs": self.data.get("location_needs", ""),
            "technology": self.data.get("tech_requirements", "").split(","),
            "staffing": {
                "initial_employees": self._convert_to_int(self.data.get("initial_employees", "0")),
                "key_positions": self.data.get("key_positions", "").split(",")
            },
            "equipment": self.data.get("equipment_needs", "").split(","),
            "supply_chain": self.data.get("supply_chain", "")
        }
        
        # Legal and regulatory
        self.config["legal"] = {
            "business_entity": self.data.get("business_entity", ""),
            "regulatory_issues": self.data.get("regulatory_issues", "").split(","),
            "licenses": self.data.get("licenses", "").split(","),
            "insurance": self.data.get("insurance_needs", "").split(",")
        }
        
        # Risk assessment
        self.config["risks"] = {
            "identified_risks": [
                self.data.get("risk1", ""),
                self.data.get("risk2", ""),
                self.data.get("risk3", "")
            ],
            "mitigation": self.data.get("risk_mitigation", ""),
            "contingency": self.data.get("contingency_plans", "")
        }
        
        # Output preferences
        self.config["preferred_output_formats"] = ["pptx", "pdf", "docx"]
        self.config["storage_target"] = "onedrive"
        
        # Additional information
        self.config["additional_info"] = self.data.get("other_details", "")
        
        return self.config
    
    def _generate_idea_id(self) -> str:
        """Generate a unique ID for the business idea."""
        base_name = self.data.get("business_name", "business").lower()
        # Replace spaces with underscores and remove special characters
        base_name = ''.join(c if c.isalnum() or c == ' ' else '' for c in base_name)
        base_name = base_name.replace(' ', '_')
        
        # Add timestamp for uniqueness
        timestamp = datetime.datetime.now().strftime("%Y%m%d")
        return f"{base_name}_{timestamp}"
    
    def _process_founders(self) -> List[Dict[str, Any]]:
        """Process founder information."""
        founders = []
        
        # We'll assume we have at least one founder (the primary contact)
        founder = {
            "name": self.data.get("contact_name", ""),
            "role": self.data.get("contact_role", ""),
            "time_commitment": self.data.get("founder_commitment", "full-time"),
            "investment_usd": self._convert_to_float(self.data.get("founder_investment", "0")),
            "experience_years": self._convert_to_int(self.data.get("founder_experience", "0")),
            "skills": self.data.get("founder_skills", "").split(",")
        }
        founders.append(founder)
        
        # In a real implementation, we'd loop through multiple founders if present
        # For now, this is just a placeholder for demonstration
        
        return founders
    
    def _process_competitors(self) -> List[Dict[str, str]]:
        """Process competitor information."""
        competitors = []
        
        for i in range(1, 4):  # We have fields for 3 competitors
            competitor_name = self.data.get(f"competitor_{i}", "")
            if competitor_name:
                competitors.append({
                    "name": competitor_name,
                    "description": ""  # In a real form, we might collect more info
                })
        
        return competitors
    
    def _process_offering(self) -> Dict[str, List[Dict[str, Any]]]:
        """Process product/service offerings."""
        # In a real implementation, we'd iterate through multiple products
        # For simplicity, we'll just use the first product information
        
        products = []
        if self.data.get("product_name"):
            products.append({
                "name": self.data.get("product_name", ""),
                "description": self.data.get("product_description", ""),
                "price_usd": self._convert_to_float(self.data.get("product_price", "0")),
                "cost_usd": self._convert_to_float(self.data.get("product_cost", "0")),
                "status": self.data.get("product_status", "Idea")
            })
        
        return {
            "products": products,
            "services": [],  # For simplicity, we're not processing services separately
            "ip_status": self.data.get("ip_status", "None"),
            "usp": self.data.get("usp", "")
        }
    
    @staticmethod
    def _convert_to_float(value: str) -> float:
        """Convert string to float, handling currency symbols and commas."""
        if not value:
            return 0.0
        
        # Remove currency symbols, commas, and other non-numeric characters
        # except for the decimal point
        clean_value = ''.join(c for c in value if c.isdigit() or c == '.')
        
        try:
            return float(clean_value)
        except ValueError:
            return 0.0
    
    @staticmethod
    def _convert_to_int(value: str) -> int:
        """Convert string to integer, handling non-numeric characters."""
        if not value:
            return 0
        
        # Remove non-numeric characters
        clean_value = ''.join(c for c in value if c.isdigit())
        
        try:
            return int(clean_value)
        except ValueError:
            return 0
    
    def to_yaml(self, output_path: str) -> None:
        """Export the processed configuration to a YAML file."""
        # Make sure we have a configuration
        if not self.config:
            self.process()
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Write the YAML file
        with open(output_path, 'w') as yaml_file:
            yaml.dump(self.config, yaml_file, default_flow_style=False, sort_keys=False)
        
        print(f"Configuration saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Convert entrepreneur form data to YAML config')
    parser.add_argument('--input', '-i', help='Input JSON file containing form data')
    parser.add_argument('--output', '-o', help='Output YAML file path')
    args = parser.parse_args()
    
    # For demonstration purposes, we'll use some sample data
    # In a real application, this would come from the Word document form
    sample_data = {
        "business_name": "Terra Roast",
        "tagline": "Sustainably sourced specialty coffee for Gen Z",
        "primary_industry": "Food & Beverage",
        "secondary_industries": "Retail,E-commerce",
        "business_description": "A boutique coffee roastery focused on ethically sourced beans with transparent supply chain and innovative brewing methods.",
        "contact_name": "Alice Kim",
        "contact_email": "alice@terraroast.com",
        "contact_phone": "555-123-4567",
        "contact_role": "CEO",
        "founder_experience": "5",
        "founder_commitment": "full-time",
        "founder_investment": "$150,000",
        "founder_skills": "Marketing,Supply Chain,Food Service",
        "target_market": "Environmentally conscious Gen Z coffee enthusiasts",
        "customer_segments": "College students,Young professionals,Coffee enthusiasts",
        "geographical_focus": "Urban centers in the US West Coast",
        "market_size": "$5,000,000",
        "market_growth": "12.5",
        "competitor_1": "Blue Bottle Coffee",
        "competitor_2": "Stumptown Coffee Roasters",
        "competitor_3": "Counter Culture Coffee",
        "product_name": "Single-origin specialty coffee beans",
        "product_description": "Ethically sourced, small-batch roasted coffee beans with QR codes for tracing origin",
        "product_price": "$22.99",
        "product_cost": "$8.50",
        "product_status": "MVP",
        "ip_status": "Trademark Pending",
        "usp": "Complete transparency from bean to cup with blockchain-verified sourcing",
        "revenue_streams": "Direct retail sales,Subscription services,Wholesale",
        "sales_channels": "E-commerce,Farmers markets,Specialty retail",
        "acquisition_strategy": "Content marketing focused on sustainability and ethical sourcing",
        "retention_strategy": "Monthly subscription model with rotating bean selection",
        "key_partnerships": "Local cafes,Organic grocery chains,Sustainable packaging suppliers",
        "initial_investment": "$250,000",
        "monthly_costs": "$20,000",
        "breakeven_timeline": "18",
        "year1_revenue": "$600,000",
        "year3_revenue": "$2,500,000",
        "funding_strategy": "Self + Angel",
        "location_needs": "Small roasting facility with retail front (1500-2000 sq ft)",
        "tech_requirements": "E-commerce platform,Subscription management system,Inventory tracking",
        "initial_employees": "5",
        "key_positions": "Master Roaster,Operations Manager,Marketing Specialist",
        "equipment_needs": "Commercial coffee roaster,Packaging equipment,Brewing equipment for demos",
        "supply_chain": "Direct relationships with coffee farms in Ethiopia, Colombia, and Guatemala",
        "business_entity": "LLC",
        "regulatory_issues": "Food handling licenses,Import regulations",
        "licenses": "Food handling,Business operation,Health department",
        "insurance_needs": "General liability,Product liability,Workers compensation",
        "launch_date": "2023-09-01",
        "milestone1_desc": "Complete roasting facility setup",
        "milestone1_date": "2023-07-15",
        "year1_goals": "Establish brand presence in 3 major cities, 2000 subscribers",
        "year3_vision": "National distribution, 15000 subscribers, own retail locations in 5 cities",
        "risk1": "Coffee bean price volatility",
        "risk2": "Supply chain disruptions from climate events",
        "risk3": "Increased competition in specialty coffee market",
        "risk_mitigation": "Long-term contracts with farmers, diversified sourcing regions",
        "contingency_plans": "Reserve inventory of 3 months supply, alternative sourcing relationships in place",
        "other_details": "Founders have existing relationships with coffee producers through previous fair trade nonprofit work."
    }
    
    # Use the input data if provided, otherwise use the sample data
    input_data = {}
    if args.input:
        import json
        with open(args.input, 'r') as json_file:
            input_data = json.load(json_file)
    else:
        input_data = sample_data
    
    # Process the data
    processor = EntrepreneurFormProcessor(input_data)
    config = processor.process()
    
    # Determine the output path
    output_path = args.output if args.output else f"configs/{config['idea_id']}.yaml"
    
    # Save the configuration
    processor.to_yaml(output_path)

if __name__ == "__main__":
    main() 