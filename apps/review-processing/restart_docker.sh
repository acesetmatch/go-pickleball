#!/bin/bash

echo "🔄 Restarting Docker Desktop..."

# Kill Docker Desktop processes
echo "   Stopping Docker Desktop..."
killall "Docker Desktop" 2>/dev/null || true
killall "com.docker.hyperkit" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 3

# Start Docker Desktop
echo "   Starting Docker Desktop..."
open -a "Docker Desktop"

# Wait for Docker to start and check status
echo "   Waiting for Docker to initialize..."
for i in {1..30}; do
    if timeout 5 docker info > /dev/null 2>&1; then
        echo "✅ Docker is running!"
        docker --version
        exit 0
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "⚠️  Docker may still be starting up. You can check with: docker info"
echo "   If it's still not working, try manually opening Docker Desktop from Applications"
