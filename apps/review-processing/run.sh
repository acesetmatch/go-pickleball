#!/bin/bash

# YouCap Project Startup Script
# This script automatically sets up and runs the entire YouCap project

set -e  # Exit on any error
set -x  # Print commands as they execute

echo "🚀 Starting YouCap Project Setup..."
echo "📍 Current directory: $(pwd)"
echo "🕐 Timestamp: $(date)"

# Check if Docker is running
echo "🔍 Checking Docker status..."
if ! timeout 10 docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running or not responding. Please:"
    echo "   1. Start Docker Desktop"
    echo "   2. Wait for Docker to fully initialize"
    echo "   3. Try running this script again"
    echo ""
    echo "🔧 You can check Docker status with: docker info"
    exit 1
else
    echo "✅ Docker is running"
    docker --version
fi

# Check if we're in the right directory
echo "🔍 Checking for docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the youcap directory."
    echo "📁 Current directory contents:"
    ls -la
    exit 1
else
    echo "✅ Found docker-compose.yml"
fi

# Check if .env file exists, if not copy from example
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your YOUTUBE_API_KEY before continuing."
    echo "   You can get a YouTube API key from: https://console.developers.google.com/"
    read -p "Press Enter after you've added your YouTube API key to .env..."
fi

# Check if YouTube API key is set
if ! grep -q "YOUTUBE_API_KEY=.*[^[:space:]]" .env; then
    echo "⚠️  YouTube API key not found in .env file."
    read -p "Enter your YouTube API key: " youtube_key
    if [ -n "$youtube_key" ]; then
        # Update the .env file with the API key
        if grep -q "YOUTUBE_API_KEY=" .env; then
            sed -i.bak "s/YOUTUBE_API_KEY=.*/YOUTUBE_API_KEY=$youtube_key/" .env
        else
            echo "YOUTUBE_API_KEY=$youtube_key" >> .env
        fi
        echo "✅ YouTube API key added to .env file."
    else
        echo "⚠️  No API key provided. Channel ingestion will not work."
    fi
fi

# Check if containers are already running
echo "🔍 Checking if YouCap containers are already running..."
running_containers=$(docker-compose ps --services --filter "status=running" 2>/dev/null || echo "")

if [ -n "$running_containers" ]; then
    echo "✅ YouCap containers are already running:"
    docker-compose ps
    echo ""
    echo "ℹ️  Skipping container restart. Services are already up!"
    echo ""
    echo "📱 Services available:"
    echo "   • Frontend:        http://localhost:3000"
    echo "   • Backend API:     http://localhost:8000"
    echo "   • API Docs:        http://localhost:8000/docs"
    echo "   • Database:        localhost:5433 (PostgreSQL)"
    echo ""
    echo "🔧 If you need to restart containers, use: docker-compose restart"
    echo "🔧 To force a full rebuild, use: ./restart_docker.sh"
    echo ""
    
    # Still offer to open browser
    read -p "🌐 Open browser to http://localhost:3000? (y/N): " open_browser
    if [[ $open_browser =~ ^[Yy]$ ]]; then
        if command -v open > /dev/null; then
            open http://localhost:3000
        elif command -v xdg-open > /dev/null; then
            xdg-open http://localhost:3000
        else
            echo "Please manually open http://localhost:3000 in your browser"
        fi
    fi
    
    echo ""
    echo "✨ YouCap is ready to use!"
    exit 0
fi

echo "🐳 Starting Docker containers..."

# Stop any existing containers and clean up
echo "🛑 Stopping existing containers..."
timeout 30 docker-compose down --remove-orphans || echo "⚠️  Timeout stopping containers (this is usually OK)"
echo "✅ Containers stopped"

# Clean up build cache and volumes to avoid stale code issues
echo "🧹 Cleaning up build cache..."
echo "   Pruning Docker system..."
docker system prune -f
echo "   Pruning Docker volumes..."
docker volume prune -f
echo "✅ Docker cleanup complete"

# Remove any cached build artifacts in frontend
echo "🧹 Cleaning frontend cache..."
if [ -d "frontend/.next" ]; then
    echo "   Removing frontend .next cache..."
    rm -rf frontend/.next
    echo "   ✅ Removed .next cache"
else
    echo "   ℹ️  No .next cache found"
fi

if [ -d "frontend/node_modules" ]; then
    echo "   Removing frontend node_modules..."
    rm -rf frontend/node_modules
    echo "   ✅ Removed node_modules"
else
    echo "   ℹ️  No node_modules found"
fi

# Build and start all services with no cache
echo "🔨 Building services with no cache..."
docker-compose build --no-cache --progress=plain
echo "✅ Build complete"

echo "🚀 Starting services..."
docker-compose up -d
echo "✅ Services started"

echo "📊 Container status:"
docker-compose ps

echo "⏳ Waiting for services to be ready..."

# Wait for backend to be ready
echo "   Waiting for backend (port 8000)..."
echo "   Backend logs (last 10 lines):"
docker-compose logs --tail=10 backend
echo "   ---"
timeout=60
counter=0
while ! curl -s http://localhost:8000/health > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Backend failed to start within $timeout seconds"
        echo "📋 Full backend logs:"
        docker-compose logs backend
        echo "📊 Container status:"
        docker-compose ps
        exit 1
    fi
    if [ $((counter % 10)) -eq 0 ]; then
        echo "   Still waiting... ($counter/$timeout seconds)"
        echo "   Latest backend logs:"
        docker-compose logs --tail=5 backend
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""
echo "✅ Backend is ready"

# Wait for frontend to be ready
echo "   Waiting for frontend (port 3000)..."
echo "   Frontend logs (last 10 lines):"
docker-compose logs --tail=10 frontend
echo "   ---"
counter=0
while ! curl -s http://localhost:3000 > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Frontend failed to start within $timeout seconds"
        echo "📋 Full frontend logs:"
        docker-compose logs frontend
        echo "📊 Container status:"
        docker-compose ps
        exit 1
    fi
    if [ $((counter % 10)) -eq 0 ]; then
        echo "   Still waiting... ($counter/$timeout seconds)"
        echo "   Latest frontend logs:"
        docker-compose logs --tail=5 frontend
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""
echo "✅ Frontend is ready"

echo ""
echo "🎉 YouCap is now running!"
echo ""
echo "📱 Services available:"
echo "   • Frontend:        http://localhost:3000"
echo "   • Backend API:     http://localhost:8000"
echo "   • API Docs:        http://localhost:8000/docs"
echo "   • Database:        localhost:5433 (PostgreSQL)"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs:       docker-compose logs -f"
echo "   • Stop services:   docker-compose down"
echo "   • Restart:         docker-compose restart"
echo ""
echo "📖 Features available:"
echo "   • Video ingestion from YouTube URLs"
echo "   • Channel ingestion (up to 50 videos)"
echo "   • Video summarization"
echo "   • Transcript search and chunking"
echo ""

# Optionally open browser
read -p "🌐 Open browser to http://localhost:3000? (y/N): " open_browser
if [[ $open_browser =~ ^[Yy]$ ]]; then
    if command -v open > /dev/null; then
        open http://localhost:3000
    elif command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3000
    else
        echo "Please manually open http://localhost:3000 in your browser"
    fi
fi

echo ""
echo "✨ Setup complete! Happy video processing!"
