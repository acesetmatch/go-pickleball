#!/bin/bash

# Quick Start Script for Go Pickleball Backend
echo "🏓 Quick Starting Go Pickleball Backend..."

# Check if we're in the right directory
if [ ! -f "go.mod" ]; then
    echo "❌ Please run this script from the backend/go directory"
    exit 1
fi

# Start database
echo "🗄️  Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run migrations
echo "🔄 Running migrations..."
cd src && go run server/db/migrate.go

# Start the backend
echo "🚀 Starting Go backend server..."
echo "📊 Server will start with telemetry logging"
echo "🔗 API available at: http://localhost:8080"
echo "❌ Press Ctrl+C to stop"
echo ""

go run .
