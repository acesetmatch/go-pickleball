#!/usr/bin/env python3
"""
Simple script to run the backend locally without Docker for testing
"""
import os
import sys
import subprocess

# Add backend to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set environment variables
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'  # Use SQLite for local testing
os.environ['EMBEDDING_MODEL'] = 'all-MiniLM-L6-v2'

print("🚀 Starting YouCap Backend locally...")
print("📊 Using SQLite database for local testing")
print("🌐 Backend will be available at: http://localhost:8000")
print("📖 API docs will be available at: http://localhost:8000/docs")
print("\n⚠️  Note: This is a simplified setup for testing the Next.js frontend")
print("   For full functionality, use Docker with PostgreSQL\n")

# Change to backend directory and run uvicorn
os.chdir(backend_path)
subprocess.run([
    sys.executable, '-m', 'uvicorn', 
    'app.main:app', 
    '--host', '0.0.0.0', 
    '--port', '8000', 
    '--reload'
])
