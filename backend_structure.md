# Nexus Business Builder - Backend Structure

## Overview
The backend of the Nexus Business Builder will be a FastAPI application that orchestrates the business plan creation process. It will handle:

1. Entrepreneur information intake
2. Configuration management
3. Market research
4. Financial modeling
5. Document generation
6. Storage interactions (OneDrive, SharePoint, local)

## Directory Structure

```
/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Application configuration
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── business_plans.py # Business plan CRUD
│   │   │   ├── templates.py    # Template management
│   │   │   └── storage.py      # Storage management
│   │   └── dependencies.py     # API dependencies
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # Auth and security utils
│   │   ├── config.py           # Configuration management
│   │   └── errors.py           # Error handling
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py             # SQLAlchemy base
│   │   ├── session.py          # DB session management
│   │   └── repositories/       # Data access layers
│   ├── models/
│   │   ├── __init__.py
│   │   ├── business_plan.py    # Business plan model
│   │   ├── user.py             # User model
│   │   └── template.py         # Template model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── business_plan.py    # Pydantic schemas
│   │   ├── user.py             # User schemas
│   │   └── template.py         # Template schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── business_plan.py    # Business plan service
│   │   ├── market_research.py  # Market research service
│   │   ├── financials.py       # Financial modeling service
│   │   ├── document_gen.py     # Document generation service
│   │   └── storage/
│   │       ├── __init__.py
│   │       ├── base.py         # Abstract storage interface
│   │       ├── onedrive.py     # OneDrive implementation
│   │       ├── sharepoint.py   # SharePoint implementation
│   │       └── local.py        # Local storage implementation
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── agent_base.py       # Base agent class
│   │   ├── market_agent.py     # Market research agent
│   │   ├── financial_agent.py  # Financial modeling agent
│   │   ├── legal_agent.py      # Legal and compliance agent
│   │   └── document_agent.py   # Document generation agent
│   └── utils/
│       ├── __init__.py
│       ├── templates.py        # Template utilities
│       ├── validators.py       # Input validation
│       └── logging.py          # Logging utilities
├── alembic/                    # Database migrations
├── tests/                      # Test directory
│   ├── __init__.py
│   ├── conftest.py             # Test fixtures
│   ├── test_api/               # API tests
│   ├── test_services/          # Service tests
│   └── test_agents/            # Agent tests
├── data/                       # Data directory
│   ├── templates/              # Document templates
│   │   ├── docx/               # Word templates
│   │   ├── pptx/               # PowerPoint templates
│   │   └── pdf/                # PDF templates
│   └── config_examples/        # Example configurations
├── scripts/                    # Utility scripts
│   ├── generate_sample_data.py # Generate sample data
│   └── setup_templates.py      # Set up document templates
├── logs/                       # Log files
├── .env                        # Environment variables
├── .env.template               # Environment template
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker configuration
└── docker-compose.yml          # Docker Compose configuration
```

## Key Components

### 1. API Layer
- RESTful API with standard CRUD operations
- Authentication and authorization
- Webhook support for asynchronous operations
- Versioned API (v1)

### 2. Business Plan Service
- Manages the business plan lifecycle
- Coordinates between different agent services
- Handles validation and normalization of business plan data

### 3. Market Research Agent
- Web scraping and data collection
- Competitive analysis
- Market size and growth estimation
- Target audience analysis

### 4. Financial Modeling Agent
- Startup cost calculation
- Revenue projections
- Cash flow analysis
- Break-even analysis
- Profitability metrics

### 5. Document Generation Service
- Word document generation using python-docx
- PowerPoint generation using python-pptx
- PDF generation using ReportLab or WeasyPrint
- Dynamic template system with merge fields

### 6. Storage Service
- Abstract interface for different storage providers
- Microsoft Graph API integration for OneDrive/SharePoint
- Local file system fallback

## Authentication Flow

1. Azure AD App Registration authentication
2. JWT token-based API authentication
3. Scoped permissions based on user roles

## Data Flow

1. **Intake**: Entrepreneur information collected via Word form or web interface
2. **Configuration**: Data transformed into YAML configuration
3. **Research**: Market research agent gathers data
4. **Analysis**: Financial modeling agent processes data
5. **Generation**: Document generation service creates business plan assets
6. **Storage**: Assets stored in the configured storage provider
7. **Notification**: User notified of completed business plan

## Deployment Architecture

```
                ┌─────────────────┐
                │ Azure AD        │
                │ Authentication  │
                └────────┬────────┘
                         │
                         ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│ Web         │    │ FastAPI     │    │ Database        │
│ Frontend    │◄──►│ Backend     │◄──►│ PostgreSQL      │
│ React+Vite  │    │             │    │                 │
└─────────────┘    └──────┬──────┘    └─────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ Agent Services          │
              │ - Market Research       │
              │ - Financial Modeling    │
              │ - Document Generation   │
              └──────────┬──────────────┘
                         │
                         ▼
              ┌─────────────────────────┐
              │ Storage Services        │
              │ - OneDrive              │
              │ - SharePoint            │
              │ - Local Storage         │
              └─────────────────────────┘
```

## Next Steps

1. Set up the basic FastAPI application
2. Implement the database models and schemas
3. Create the storage service with OneDrive integration
4. Build the document generation service
5. Develop the market research agent
6. Implement the financial modeling agent
7. Connect all components together through the business plan service
8. Add authentication and security
9. Create tests for all components
10. Set up CI/CD pipeline 