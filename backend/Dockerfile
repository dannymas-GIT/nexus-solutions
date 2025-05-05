# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies needed for WeasyPrint
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0 libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Copy only requirements first to leverage Docker cache
COPY backend/requirements.txt .

# Add a build argument to break cache
ARG CACHEBUST=1

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Set the working directory to the backend subdirectory
WORKDIR /app/backend

# Expose the port the app runs on
# Note: We'll use port 8001 as specified previously to avoid conflicts
EXPOSE 8001

# Command to run the application
# Use 0.0.0.0 to make it accessible outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"] 