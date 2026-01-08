#!/bin/bash

# Quick start script for TypeScript + Fastify paddle recommendation service

echo "🚀 Starting TypeScript + Fastify Paddle Recommendation Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Start the service
echo "🎯 Starting service on port 3001..."
echo "📊 Health check: http://localhost:3001/api/v1/health"
echo "📋 API docs: See README.md for endpoints"
echo ""

npm run dev
