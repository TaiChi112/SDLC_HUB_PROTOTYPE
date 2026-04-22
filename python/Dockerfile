FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for MCP server
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir flask flask-cors

# Copy application code
COPY . .

# Setup MCP server dependencies
WORKDIR /app/mcp-server
RUN npm install

# Set working directory back to app
WORKDIR /app

# Create directories for data persistence
RUN mkdir -p /app/data /app/diagrams /app/logs

# Expose ports
# 5000: Flask Web UI
# 8000: Python API (if running)
EXPOSE 5000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Default command: Run Flask web UI
ENV PYTHONUNBUFFERED=1
ENV CALENDAR_MODE=mock
ENV FLASK_ENV=production

CMD ["python", "app.py"]
