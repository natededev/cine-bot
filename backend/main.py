"""
CineBot Backend - API-Driven Movie Assistant
No LLM/Ollama dependencies - Pure API-driven intelligence
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import logging
from typing import List, Optional, Dict, Any
import asyncio
import time
import re
from datetime import datetime

# Local imports
from intent_classifier import IntentClassifier, Intent
from response_generator import ResponseGenerator, ChatResponse
from movie_api_service import movie_api

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# API Keys validation
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
OMDB_API_KEY = os.getenv("OMDB_API_KEY")

if not TMDB_API_KEY:
    logger.error("❌ TMDB_API_KEY is required!")
    raise ValueError("TMDB_API_KEY environment variable is required")

if not OMDB_API_KEY:
    logger.warning("⚠️ OMDB_API_KEY not found - OMDb features will be limited")

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Initialize FastAPI app
app = FastAPI(
    title="CineBot API",
    description="API-driven movie assistant powered by TMDb and OMDb",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
intent_classifier = IntentClassifier()
response_generator = ResponseGenerator()

# In-memory conversation storage (replace with database in production)
conversations: Dict[str, Dict] = {}

# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default"

class ChatResponseModel(BaseModel):
    response: str
    conversation_id: str
    suggestions: Optional[List[str]] = None
    data: Optional[Dict[str, Any]] = None
    intent: Optional[str] = None
    response_type: Optional[str] = None  # 'recommendations', 'trivia', 'debate', or None for normal
    processing_time: float
    
    model_config = {"extra": "forbid"}

class MovieSearchRequest(BaseModel):
    query: str
    year: Optional[int] = None
    limit: Optional[int] = 5

class RecommendationRequest(BaseModel):
    genre: Optional[str] = None
    year: Optional[int] = None
    movie_id: Optional[int] = None
    limit: Optional[int] = 5

class PersonSearchRequest(BaseModel):
    name: str

class TriviaRequest(BaseModel):
    movie_id: Optional[int] = None
    movie_title: Optional[str] = None

# Performance monitoring decorator
def log_performance(func):
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        end_time = time.time()
        logger.info(f"⏱️ {func.__name__} took {end_time - start_time:.2f}s")
        return result
    return wrapper

@app.on_event("startup")
async def startup_event():
    """Initialize services"""
    logger.info("🚀 Starting CineBot API-driven backend...")
    logger.info("✅ Intent classifier initialized")
    logger.info("✅ Response generator initialized")
    logger.info("✅ Movie API service ready")
    logger.info("🎬 CineBot is ready to serve!")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CineBot API",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "apis": {
            "tmdb": "✅" if TMDB_API_KEY else "❌",
            "omdb": "✅" if OMDB_API_KEY else "⚠️"
        }
    }

# Main chat endpoint
@app.post("/chat", response_model=ChatResponseModel)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint - processes user messages with intent classification
    and generates API-driven responses
    """
    start_time = time.time()
    
    try:
        user_message = request.message.strip()
        conversation_id = request.conversation_id or "default"
        
        logger.info(f"💬 Processing: '{user_message[:50]}...' | Session: {conversation_id}")
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Classify intent
        intent_result = intent_classifier.classify(user_message)
        logger.info(f"🎯 Intent: {intent_result.intent.value} (confidence: {intent_result.confidence:.2f})")
        logger.info(f"📋 Extracted entities: {intent_result.entities}")

        # Context-aware follow-up: vague requests
        last_bot_message = None
        
        # Initialize conversation if it doesn't exist
        if conversation_id not in conversations:
            conversations[conversation_id] = {
                "messages": [],
                "context": {"recent_titles": [], "recent_genres": []},
                "created_at": datetime.now().isoformat()
            }
        
        if conversations[conversation_id]["messages"]:
            for msg in reversed(conversations[conversation_id]["messages"]):
                if "bot" in msg:
                    last_bot_message = msg["bot"]
                    break

        # DIRECT MOVIE INFO REQUEST HANDLING
        # If message contains "tell me about X", treat as movie info request regardless of intent
        movie_title = None
        tell_about_match = re.search(r'(?:tell me about|about|plot of|info on|give me info about|what is|details about|info about)\s+(.+?)(?:\?|$|\.)', user_message, re.I)
        if tell_about_match:
            movie_title = tell_about_match.group(1).strip()
            logger.info(f"🎬 Direct movie request detected from pattern: '{movie_title}'")
        # Or if message is just a few words and matches a recent title
        elif len(user_message.split()) <= 3:
            # Check if message is just a movie title we've recommended
            if conversation_id in conversations and "context" in conversations[conversation_id]:
                recent_titles = conversations[conversation_id]["context"].get("recent_titles", [])
                for title in recent_titles:
                    if user_message.lower() in title.lower() or title.lower() in user_message.lower():
                        movie_title = title
                        logger.info(f"🎬 Direct movie request detected from recent titles: '{movie_title}'")
                        break
            
        # If we found a movie title through any means, respond with info
        if movie_title:
            # Get movie info and respond directly
            try:
                movies = await movie_api.search_movies(movie_title, limit=1)
                if movies:
                    movie = movies[0]
                    response = f"🎬 **{movie['title']}** ({movie.get('year', 'N/A')})\n\n"
                    response += f"**Rating:** {movie.get('rating', 'N/A')}/10\n\n"
                    response += f"**Plot:** {movie.get('plot', 'Plot information not available.')}\n\n"
                    if movie.get('cast'):
                        response += f"**Cast:** {', '.join(movie['cast'][:5])}\n\n"
                    if movie.get('director'):
                        response += f"**Director:** {movie['director']}\n\n"
                        
                    return ChatResponseModel(
                        response=response,
                        conversation_id=conversation_id,
                        suggestions=[
                            f"More movies like {movie['title']}",
                            f"Trivia about {movie['title']}",
                            "Recommend something else"
                        ],
                        data={"movie": movie},
                        intent="movie_info",
                        response_type="movie_info",
                        processing_time=time.time() - start_time
                    )
                else:
                    # Couldn't find movie, let normal processing continue
                    pass
            except Exception as e:
                logger.error(f"Error getting movie info: {e}")
                # Continue with normal processing
        # If user says a vague follow-up, use recent context for smarter response
        elif user_message.lower() in [
            "tell me more about these movies", "tell me more", "more info on these", "details on these movies",
            "what else?", "anything else?", "more info", "more details", "elaborate", "expand", "explain"
        ]:
            # If a valid title is extracted, respond with info
            if intent_result.entities.get("title"):
                # Let the normal response generator handle it
                pass
            else:
                # Ensure context exists
                if "context" not in conversations[conversation_id]:
                    conversations[conversation_id]["context"] = {"recent_titles": [], "recent_genres": []}
                ctx = conversations[conversation_id]["context"]
                recent_titles = ctx.get("recent_titles", [])
                recent_genres = ctx.get("recent_genres", [])
                if recent_titles:
                    title_list = ', '.join(recent_titles)
                    return ChatResponseModel(
                        response=f"Would you like more details about one of these movies: {title_list}? Please specify the title! 📖",
                        conversation_id=conversation_id,
                        suggestions=[f"Tell me about {t}" for t in recent_titles],
                        data=None,
                        intent="clarification",
                        response_type=None,
                        processing_time=time.time() - start_time
                    )
                elif recent_genres:
                    genre_list = ', '.join(recent_genres)
                    return ChatResponseModel(
                        response=f"Are you interested in more movies from these genres: {genre_list}? You can ask for recommendations or details! 🎬",
                        conversation_id=conversation_id,
                        suggestions=[f"Recommend more {g} movies" for g in recent_genres],
                        data=None,
                        intent="clarification",
                        response_type=None,
                        processing_time=time.time() - start_time
                    )
                else:
                    return ChatResponseModel(
                        response="Which movie or genre would you like to know more about? Please specify! 📖",
                        conversation_id=conversation_id,
                        suggestions=None,
                        data=None,
                        intent="clarification",
                        response_type=None,
                        processing_time=time.time() - start_time
                    )
        
        # Update conversation context and track recent entities
        if conversation_id not in conversations:
            conversations[conversation_id] = {
                "messages": [],
                "context": {"recent_titles": [], "recent_genres": []},
                "created_at": datetime.now().isoformat()
            }

        # Track entities for context-aware follow-ups
        entities = intent_result.entities
        # Ensure context exists
        if "context" not in conversations[conversation_id]:
            conversations[conversation_id]["context"] = {"recent_titles": [], "recent_genres": []}
        ctx = conversations[conversation_id]["context"]
        if "title" in entities and entities["title"]:
            ctx.setdefault("recent_titles", []).append(entities["title"])
            ctx["recent_titles"] = ctx["recent_titles"][-5:]
        if "genre" in entities and entities["genre"]:
            ctx.setdefault("recent_genres", []).append(entities["genre"])
            ctx["recent_genres"] = ctx["recent_genres"][-5:]

        conversations[conversation_id]["messages"].append({
            "user": user_message,
            "timestamp": datetime.now().isoformat(),
            "intent": intent_result.intent.value,
            "entities": entities
        })

        # Keep only last 10 messages to prevent memory bloat
        conversations[conversation_id]["messages"] = conversations[conversation_id]["messages"][-10:]
        
        # Generate response
        chat_response = await response_generator.generate_response(intent_result)
        
        # Log the response
        conversations[conversation_id]["messages"].append({
            "bot": chat_response.content[:100] + "..." if len(chat_response.content) > 100 else chat_response.content,
            "timestamp": datetime.now().isoformat()
        })
        
        processing_time = time.time() - start_time
        
        return ChatResponseModel(
            response=chat_response.content,
            conversation_id=conversation_id,
            suggestions=chat_response.suggestions,
            data=chat_response.data,
            intent=intent_result.intent.value,
            response_type=chat_response.response_type,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"❌ Chat error: {str(e)}")
        processing_time = time.time() - start_time
        
        return ChatResponseModel(
            response="I'm sorry, but I encountered an error processing your request. Please try again! 🎬",
            conversation_id=request.conversation_id or "default",
            suggestions=["Try a different question", "Search for a movie", "Ask for recommendations"],
            intent="error",
            processing_time=processing_time
        )

# Movie search endpoint
@app.post("/movies/search")
async def search_movies(request: MovieSearchRequest):
    """Search for movies by title"""
    try:
        movies = await movie_api.search_movies(
            query=request.query,
            year=request.year,
            limit=request.limit
        )
        
        return {
            "movies": movies,
            "total": len(movies),
            "query": request.query
        }
        
    except Exception as e:
        logger.error(f"Movie search error: {e}")
        raise HTTPException(status_code=500, detail="Error searching for movies")

# Movie details endpoint
@app.get("/movies/{movie_id}")
async def get_movie_details(movie_id: int):
    """Get detailed information about a specific movie"""
    try:
        movie = await movie_api.get_movie_details(movie_id)
        
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        
        return {"movie": movie}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Movie details error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching movie details")

# Recommendations endpoint
@app.post("/movies/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """Get movie recommendations"""
    try:
        if request.movie_id:
            # Get recommendations based on a specific movie
            movies = await movie_api.get_movie_recommendations(
                movie_id=request.movie_id,
                limit=request.limit
            )
        elif request.genre:
            # Get recommendations by genre
            year_range = None
            if request.year:
                year_range = (request.year - 2, request.year + 2)
            
            movies = await movie_api.get_genre_recommendations(
                genre=request.genre,
                year_range=year_range,
                limit=request.limit
            )
        else:
            # Get popular movies
            movies = await movie_api.get_genre_recommendations(
                genre="action",  # Default to action for popular movies
                limit=request.limit
            )
        
        return {
            "recommendations": movies,
            "total": len(movies),
            "criteria": {
                "genre": request.genre,
                "year": request.year,
                "movie_id": request.movie_id
            }
        }
        
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching recommendations")

# Person search endpoint
@app.post("/people/search")
async def search_person(request: PersonSearchRequest):
    """Search for actors, directors, and other people"""
    try:
        person = await movie_api.search_person(request.name)
        
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        
        return {"person": person}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Person search error: {e}")
        raise HTTPException(status_code=500, detail="Error searching for person")

# Trivia endpoint
@app.post("/movies/trivia")
async def get_trivia(request: TriviaRequest):
    """Get movie trivia and interesting facts"""
    try:
        movie_id = request.movie_id
        
        if not movie_id and request.movie_title:
            # Search for movie by title first
            movies = await movie_api.search_movies(request.movie_title, limit=1)
            if movies:
                movie_id = movies[0]["id"]
        
        if not movie_id:
            raise HTTPException(status_code=400, detail="Movie ID or title required")
        
        trivia = await movie_api.get_movie_trivia(movie_id)
        movie_details = await movie_api.get_movie_details(movie_id)
        
        return {
            "trivia": trivia,
            "movie": {
                "id": movie_id,
                "title": movie_details["title"] if movie_details else "Unknown",
                "year": movie_details["year"] if movie_details else "Unknown"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trivia error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching trivia")

# Conversation history endpoint
@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation history"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "conversation_id": conversation_id,
        "conversation": conversations[conversation_id]
    }

# Clear conversation endpoint
@app.delete("/conversations/{conversation_id}")
async def clear_conversation(conversation_id: str):
    """Clear conversation history"""
    if conversation_id in conversations:
        del conversations[conversation_id]
        return {"message": f"Conversation {conversation_id} cleared"}
    else:
        raise HTTPException(status_code=404, detail="Conversation not found")

# Stats endpoint
@app.get("/stats")
async def get_stats():
    """Get service statistics"""
    return {
        "active_conversations": len(conversations),
        "total_messages": sum(len(conv["messages"]) for conv in conversations.values()),
        "uptime": "Running",
        "version": "2.0.0"
    }

# Run the application
if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 Starting CineBot server on {HOST}:{PORT}")
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
