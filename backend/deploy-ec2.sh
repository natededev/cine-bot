#!/bin/bash

# CineBot Backend Deployment Script for AWS EC2
# Run this on your EC2 instance to deploy the backend

echo "🎬 CineBot Backend - AWS EC2 Deployment"
echo "======================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3.9+ if not present
echo "🐍 Installing Python..."
sudo apt install -y python3 python3-pip python3-venv git curl

# Clone repository (you'll need to replace this with your repo)
echo "📥 Cloning repository..."
# git clone https://github.com/yourusername/cine-bot.git
# cd cine-bot/backend

echo "📂 Make sure you're in the backend directory with your code"
echo "   If you haven't cloned yet, run: git clone <your-repo-url>"

# Create virtual environment
echo "🔧 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Setup environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env with your API keys!"
    echo "   nano .env"
    echo ""
fi

# Create systemd service
echo "🚀 Setting up systemd service..."
sudo tee /etc/systemd/system/cinebot.service > /dev/null <<EOF
[Unit]
Description=CineBot FastAPI Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/venv/bin
ExecStart=$(pwd)/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "🔄 Enabling service..."
sudo systemctl daemon-reload
sudo systemctl enable cinebot
sudo systemctl start cinebot

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env with your API keys: nano .env"
echo "2. Restart service: sudo systemctl restart cinebot"
echo "3. Check status: sudo systemctl status cinebot"
echo "4. View logs: sudo journalctl -u cinebot -f"
echo ""
echo "🌐 Your API will be available at: http://your-ec2-ip:8000"
echo "📋 Don't forget to configure security groups to allow port 8000!"
echo ""
echo "🔧 Useful commands:"
echo "   sudo systemctl start cinebot    # Start service"
echo "   sudo systemctl stop cinebot     # Stop service"
echo "   sudo systemctl restart cinebot  # Restart service"
echo "   sudo systemctl status cinebot   # Check status"
