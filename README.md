# Nexus Business Builder

An intelligent business planning system that transforms entrepreneur inputs into comprehensive, professionally designed business plans.

## Overview

Nexus Business Builder is a full-stack application that automates the creation of detailed business plans. It leverages AI-powered market research, financial modeling, and document generation to produce high-quality business planning documents based on an entrepreneur's initial inputs.

## Features

- **Business Plan Generator**: Transform business ideas into comprehensive business plans
- **Market Research Automation**: Gather competitive intelligence and market trends automatically
- **Financial Modeling**: Generate realistic financial projections and break-even analysis
- **Document Generation**: Create professional Word documents, PowerPoint presentations, and PDFs
- **Cloud Integration**: Store and share all business plan assets via Microsoft 365
- **Multi-format Support**: Export business plans in various formats (DOCX, PPTX, PDF)

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite for bundling
- Tailwind CSS for styling
- React Query for server state management
- React Hook Form for form handling

### Backend
- Python 3.11+ with FastAPI
- SQLAlchemy ORM with PostgreSQL
- LangChain for agent orchestration
- Microsoft Graph API for Office document generation and storage
- OpenAI API for AI capabilities

### Infrastructure
- Azure AD App Registration for authentication
- Azure Key Vault for secret management
- Docker and Docker Compose for containerization

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Microsoft 365 Business Premium subscription
- Azure AD tenant
- Docker and Docker Compose (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/NexusBusinessBuilder.git
   cd NexusBusinessBuilder
   ```

2. Create and configure environment variables:
   ```bash
   cp azure_env.template .env
   # Edit .env file with your specific credentials
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

5. Start the development servers:
   ```bash
   # Backend
   cd ../backend
   uvicorn app.main:app --reload

   # Frontend
   cd ../frontend
   npm run dev
   ```

## Running with Docker

The project includes a standalone Docker Compose setup that **co-exists with ve-projects** without conflicts:

- **Isolated network**: `nexus-network` (separate from ve-projects' `ve-network`)
- **Non-conflicting ports**: Frontend on `8082` (ve-projects uses 8080, 8081, 8888, 3306)

1. **Build and start** (from project root):

    ```bash
    cd /opt/projects/nexus-solutions
    docker compose up -d --build
    ```

2. **Access the application:**
    - Frontend: `http://localhost:8082` (or `http://nexus-solutions.us:8082` if DNS points here)
    - API docs: `http://localhost:8082/api` → proxied to backend

3. **Stop the services:**

    ```bash
    docker compose down
    ```

## Project Structure

```
NexusBusinessBuilder/
├── backend/              # Python FastAPI backend
├── frontend/             # React frontend
├── certificates/         # Authentication certificates
├── configs/              # Business configuration files
├── scripts/              # Utility scripts
└── templates/            # Document templates
```

## Usage

1. Fill out the entrepreneur information form
2. Submit for processing
3. Review generated business plan documents
4. Export to desired formats
5. Share via OneDrive or SharePoint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Microsoft Graph API for document generation capabilities
- OpenAI for AI modeling and text generation
- Various open-source libraries that make this project possible
