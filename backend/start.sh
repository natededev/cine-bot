#!/bin/bash

# CineBot Backend Startup Script
# Simple cross-platform script to start the backend

echo "🎬 Starting CineBot Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please copy .env.example to .env and add your API keys."
    exit 1
fi

# Start the server
echo "🚀 Starting FastAPI server..."
python main.py
