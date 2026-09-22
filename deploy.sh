#!/bin/bash
set -e

echo "Starting Deployment for DocNova..."

# 1. Pull latest code
echo "Pulling latest changes from git..."
git pull origin main

# 2. Rebuild the docker container
echo "Building the Docker image..."
docker compose -f docker-compose.yml build

# 3. Start the container in detached mode
echo "Starting container..."
docker compose -f docker-compose.yml up -d

# 4. Run database migrations inside the container
echo "Running Prisma migrations..."
docker compose exec -T app npx prisma migrate deploy

echo "Deployment completed successfully! ✅"
