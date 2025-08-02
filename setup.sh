#!/bin/bash

# CineBot Development Setup Script
# Run this script to set up the entire development environment

echo "🎬 CineBot Development Setup"
echo "=========================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.9+ first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend
echo ""
echo "🐍 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Setup environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your API keys!"
fi

cd ..

# Setup frontend
echo ""
echo "⚛️  Setting up frontend..."
cd frontend

echo "📥 Installing Node.js dependencies..."
npm install

# Setup environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Add your TMDb API key to backend/.env"
echo "2. Optionally add OMDb API key to backend/.env" 
echo "3. Start development:"
echo "   - Backend: cd backend && python main.py"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Visit: http://localhost:8080 or http://localhost:8081"
