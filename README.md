# 🎬 CineBot - Intelligent Movie Discovery Assistant

> **API-Driven Architecture**: Fast, intelligent movie assistant with natural language understanding, powered by TMDb and OMDb APIs.

## 📖 Overview

CineBot is a sophisticated, full-stack movie discovery assistant that combines intelligent natural language processing with comprehensive movie data. It provides personalized recommendations, fascinating trivia, and engaging movie debates through a smooth, minimal interface.

### ✨ Key Features

- 🤖 **Intelligent Natural Language Processing** - Understands flexible, conversational requests
- 🎯 **Smart Recommendations** - Personalized movie suggestions with specialized UI cards
- 🧠 **Movie Trivia & Facts** - Fascinating insights with dedicated trivia interface
- ⚔️ **Movie Debates** - Engaging discussions about controversial topics and comparisons
- 🔍 **Advanced Search** - Find movies by title, actor, director, or genre
- 🎨 **Action Buttons** - Quick access to recommendations, trivia, and debate features
- ⚡ **Lightning Fast** - Sub-second response times with optimized API calls
- 🌐 **Production Ready** - Clean architecture for easy deployment

### 🎯 Smart Intent Recognition
CineBot understands natural language including:
- **Implicit requests**: "something exciting" → action recommendations
- **Genre variations**: "scary movies", "horror films", "frightening" → horror genre
- **Debate triggers**: "marvel vs dc", "overrated movies", "hot take"
- **Trivia requests**: "fun facts", "behind the scenes", "did you know"

### 🚀 **Deployment Stack**
- **Frontend:** Vercel (React/Vite) - Zero-config deployment with CDN
- **Backend:** AWS EC2 (FastAPI) - Reliable, scalable Python API server

## 🏗️ Project Structure

```
cine-bot/
├── backend/           # FastAPI backend with TMDb/OMDb integration
│   ├── main.py                    # FastAPI application & routes
│   ├── intent_classifier.py      # Rule-based intent detection
│   ├── movie_api_service.py       # TMDb & OMDb API integration
│   ├── response_generator.py      # Template-based responses
│   ├── requirements.txt           # Python dependencies
│   ├── deploy-ec2.sh              # AWS EC2 deployment script
│   ├── .env / .env.example        # Environment variables
│   └── start.sh / start.bat       # Local dev startup scripts
└── frontend/          # React + Vite frontend with modern UI
    ├── src/                      # Source code
    │   ├── components/           # UI components (shadcn/ui)
    │   ├── hooks/                # React hooks (useChat, etc.)
    │   ├── services/             # API client
    │   └── pages/                # Page components
    ├── public/                   # Static assets
    ├── package.json              # Node.js dependencies
    ├── .env / .env.example       # Environment variables
    └── vercel.json               # Vercel config
```

## 🚀 Quick Start

> **Production Deployment:** This project is optimized for **Vercel** (frontend) + **AWS EC2** (backend) deployment.

### Prerequisites

- **Backend:** Python 3.9+
- **Frontend:** Node.js 18+
- **APIs:** TMDb API key (required), OMDb API key (optional)
- **Production:** Vercel account, AWS EC2 instance

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd cine-bot
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (set VITE_API_URL for production)
```

### 4. Start Development

```bash
# Terminal 1 - Backend (Port 8000)
cd backend
python main.py

# Terminal 2 - Frontend (Port 8080/8081)
cd frontend
npm run dev
```

Visit: `http://localhost:8080` or `http://localhost:8081`

## 🎯 Enhanced User Experience

### Action Buttons
CineBot features three main action buttons for quick access:

- **🎬 Recommendations Button**: Instantly get movie suggestions
- **🧠 Trivia Button**: Discover fascinating movie facts
- **⚔️ Debate Button**: Engage in movie discussions and comparisons

### Specialized Message Types
Different types of responses are displayed with specialized UI components:

- **Recommendations Messages**: Enhanced cards showing movie posters, ratings, and details
- **Trivia Messages**: Formatted fact displays with engaging visuals
- **Debate Messages**: Interactive discussion prompts with opinion options

### Natural Language Examples
CineBot understands flexible, conversational requests:

```
User: "action"
CineBot: Shows action movie recommendations in specialized cards

User: "tell me something interesting about movies"
CineBot: Displays trivia in an engaging trivia interface

User: "marvel vs dc"
CineBot: Starts a movie debate with discussion options

User: "something scary"
CineBot: Recommends horror movies

User: "fun facts about Inception"
CineBot: Shows trivia specifically about Inception
```

## 🔧 Configuration

### Backend Environment Variables (`backend/.env`)

```bash
TMDB_API_KEY=your_tmdb_api_key_here
OMDB_API_KEY=your_omdb_api_key_here
HOST=0.0.0.0
PORT=8000
DEBUG=False
CACHE_TTL=300
CONTEXT_CACHE_TTL=120
PREFERENCES_CACHE_TTL=600
```

### Frontend Environment Variables (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:8000   # For local dev
# For Vercel production, set to your EC2 backend URL
VITE_API_TIMEOUT=30000
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=false
VITE_TYPING_INDICATOR_DELAY=5000
VITE_MAX_MESSAGES=100
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | API health check |
| `POST` | `/chat` | Main chat interface |
| `POST` | `/movies/search` | Search movies |
| `GET` | `/movies/{id}` | Get movie details |
| `POST` | `/movies/recommendations` | Get recommendations |
| `POST` | `/people/search` | Search actors/directors |
| `POST` | `/movies/trivia` | Get movie trivia |

### Example Chat Request

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "recommend me a good action movie"}'
```

## 🛠️ Development & Troubleshooting

### Backend
- Hot reload: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Run tests: `python -m pytest`
- Code formatting: `black .` and `isort .`
- Common issues: Check `.env` for correct API keys, ensure ports are open

### Frontend
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`
- Common issues: Check `VITE_API_URL` matches backend, restart dev server if env changes

## 🔍 Enhanced Intent Classification

CineBot uses sophisticated rule-based intent detection for fast, reliable responses with flexible natural language understanding:

**Supported Intents:**
- **Greeting** - "hi", "hello", "hey", "what's up"
- **Genre Query** - Understands explicit ("action movies") and implicit ("something exciting") requests
- **Movie Search** - "find [movie]", "tell me about [movie]", "search for [title]"
- **Recommendations** - "recommend", "suggest", "what should I watch", "I want to see"
- **Trivia** - "trivia", "fun fact", "behind the scenes", "did you know", "surprise me"
- **Debate** - "debate", "vs", "better than", "overrated", "controversial", "hot take"
- **Actor/Director Info** - "who stars in", "directed by", "cast of"
- **Rating Query** - "rating", "score", "how good is"
- **Plot Query** - "what's it about", "plot", "summary"

**Advanced Pattern Recognition:**
- **Genre Flexibility**: "scary" → horror, "funny" → comedy, "exciting" → action
- **Natural Conversation**: "I'm in the mood for something romantic" → romance recommendations
- **Debate Detection**: "which is better marvel or dc" → movie debate interface
- **Implicit Requests**: "something new" → recent movie recommendations

**Examples:**
- Single word: `romance` → Romantic movie recommendations with specialized cards
- Natural language: `tell me something cool about movies` → Random movie trivia
- Debate trigger: `overrated movies` → Movie debate interface
- Flexible genre: `something that will make me laugh` → Comedy suggestions

## 🎨 UI Components
- React 18 + TypeScript
- Vite
- TailwindCSS
- shadcn/ui (Radix UI)
- Lucide React icons
- TanStack Query

## 🚢 Deployment

### Frontend → Vercel
- Connect your repo to Vercel
- Set `VITE_API_URL` to your EC2 backend URL in Vercel dashboard
- Automatic builds and CDN

### Backend → AWS EC2
- Use `deploy-ec2.sh` for easy setup
- Add your API keys to `.env`
- Use systemd or PM2 for process management
- Open port 8000 in EC2 security group

### Alternative Platforms
- Backend: Railway, Render, DigitalOcean, AWS Lambda
- Frontend: Netlify, GitHub Pages, AWS S3 + CloudFront

## 🔐 API Keys Setup
- TMDb: https://www.themoviedb.org/settings/api
- OMDb: http://www.omdbapi.com/apikey.aspx

## 📊 Performance
- Response Time: < 200ms average
- API Calls: Cached with TTL
- Bundle Size: ~160KB (frontend)
- Memory Usage: ~50MB (backend)

## 🤝 Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License
MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments
- TMDb, OMDb, FastAPI, React, shadcn/ui

---

**🎬 Ready to explore the world of cinema? Start chatting with CineBot!**

# CineBot

A conversational movie assistant powered by FastAPI (backend) and React/Vite (frontend).

## Features
- Movie recommendations by genre, year, or mood
- Movie info, trivia, cast, director, and more
- Context-aware multi-turn conversations
- Quick action buttons for recommendations, trivia, debate
- API-driven, no LLM dependencies

## Backend Setup
1. Install Python 3.9+
2. Create and activate a virtual environment:
   ```sh
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```
3. Install dependencies:
   ```sh
   pip install -r backend/requirements.txt
   ```
4. Create a `.env` file in `backend/` with your API keys:
   ```
   TMDB_API_KEY=your_tmdb_key
   OMDB_API_KEY=your_omdb_key
   ```
5. Start the backend:
   ```sh
   cd backend
   python main.py
   ```

## Frontend Setup
1. Install Node.js and npm
2. Install dependencies:
   ```sh
   cd frontend
   npm install
   ```
3. Start the frontend:
   ```sh
   npm run dev
   ```

## Deployment
- Use AWS EC2 or similar for backend hosting
- Set environment variables securely
- Use a process manager (pm2, supervisor, systemd) for backend
- Use Nginx or similar as a reverse proxy for production

## Security
- `.env` is ignored by git
- No secrets or API keys in code
- Cross-platform line endings via `.gitattributes`

## Contributing
PRs welcome! See `SYSTEM_GUIDE.md` for architecture and rules.
