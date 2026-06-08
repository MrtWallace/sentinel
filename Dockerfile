FROM python:3.11-slim

# Install Node.js + yarn
RUN apt-get update && \
    apt-get install -y curl git && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend dependencies
COPY agent/requirements.txt agent/requirements.txt
RUN pip install --no-cache-dir -r agent/requirements.txt

# Frontend dependencies
COPY frontend/package.json frontend/yarn.lock frontend/
COPY frontend/packages/nextjs/package.json frontend/packages/nextjs/
RUN cd frontend && yarn install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN cd frontend && yarn next:build

# Expose ports
EXPOSE 8000 3000

# Start both services
CMD ["bash", "scripts/dev.sh"]
