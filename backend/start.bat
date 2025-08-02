@echo off
echo 🎬 Starting CineBot Backend...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Check for .env file
if not exist ".env" (
    echo ⚠️  .env file not found. Please copy .env.example to .env and add your API keys.
    pause
    exit /b 1
)

REM Start the server
echo 🚀 Starting FastAPI server...
python main.py

pause
