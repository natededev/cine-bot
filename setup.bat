@echo off
echo 🎬 CineBot Development Setup
echo ==========================

REM Check prerequisites
echo 📋 Checking prerequisites...

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Setup backend
echo.
echo 🐍 Setting up backend...
cd backend

if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

echo 🔧 Activating virtual environment...
call venv\Scripts\activate

echo 📥 Installing Python dependencies...
pip install -r requirements.txt

REM Setup environment file
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit backend\.env with your API keys!
)

cd ..

REM Setup frontend
echo.
echo ⚛️  Setting up frontend...
cd frontend

echo 📥 Installing Node.js dependencies...
npm install

REM Setup environment file
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
)

cd ..

echo.
echo 🎉 Setup complete!
echo.
echo 📚 Next steps:
echo 1. Add your TMDb API key to backend\.env
echo 2. Optionally add OMDb API key to backend\.env
echo 3. Start development:
echo    - Backend: cd backend ^&^& python main.py
echo    - Frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 Visit: http://localhost:8080 or http://localhost:8081

pause
