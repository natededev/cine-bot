"""
Enhanced movie API tools with better error handling and caching
Focused on TMDb and OMDb integration without LLM dependencies
"""

import os
import httpx
import asyncio
from typing import List, Dict, Optional, Tuple, Any
import logging
from datetime import datetime, timedelta
from cachetools import TTLCache
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# API Configuration
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
OMDB_API_KEY = os.getenv("OMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
OMDB_BASE_URL = "http://www.omdbapi.com"

# Cache Configuration
MOVIE_CACHE = TTLCache(maxsize=1000, ttl=3600)  # 1 hour cache
SEARCH_CACHE = TTLCache(maxsize=500, ttl=1800)  # 30 minutes for search results
PERSON_CACHE = TTLCache(maxsize=500, ttl=3600)  # 1 hour for person data

# HTTP Client
async def get_http_client() -> httpx.AsyncClient:
    """Get HTTP client with optimized settings"""
    return httpx.AsyncClient(
        timeout=httpx.Timeout(10.0),
        limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
    )

class MovieAPIService:
    """Enhanced movie API service for CineBot"""
    
    def __init__(self):
        self.client = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self.client is None:
            self.client = await get_http_client()
        return self.client
    
    async def search_movies(self, query: str, year: Optional[int] = None, limit: int = 5) -> List[Dict]:
        """Search for movies using TMDb"""
        cache_key = f"search_{query}_{year}_{limit}"
        if cache_key in SEARCH_CACHE:
            return SEARCH_CACHE[cache_key]

        client = await self._get_client()
        
        params = {
            "api_key": TMDB_API_KEY,
            "query": query,
            "language": "en-US",
            "page": 1,
            "include_adult": False
        }
        if year:
            params["year"] = year

        try:
            response = await client.get(f"{TMDB_BASE_URL}/search/movie", params=params)
            response.raise_for_status()
            results = response.json()["results"][:limit]
            
            # Enrich with basic info
            movies = []
            for movie in results:
                movie_data = {
                    "id": movie["id"],
                    "title": movie["title"],
                    "year": movie["release_date"][:4] if movie.get("release_date") else "Unknown",
                    "overview": movie.get("overview", ""),
                    "rating": movie.get("vote_average", 0),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                    "genres": await self._get_movie_genres(movie["id"]) if movie["id"] else [],
                }
                movies.append(movie_data)
            
            SEARCH_CACHE[cache_key] = movies
            return movies
            
        except Exception as e:
            logger.error(f"Error searching movies: {e}")
            return []

    async def get_movie_details(self, movie_id: int) -> Optional[Dict]:
        """Get detailed movie information"""
        cache_key = f"movie_{movie_id}"
        if cache_key in MOVIE_CACHE:
            return MOVIE_CACHE[cache_key]

        client = await self._get_client()
        
        try:
            # Get basic movie details
            response = await client.get(
                f"{TMDB_BASE_URL}/movie/{movie_id}",
                params={"api_key": TMDB_API_KEY, "language": "en-US"}
            )
            response.raise_for_status()
            movie_data = response.json()
            
            # Get credits (cast and crew)
            credits_response = await client.get(
                f"{TMDB_BASE_URL}/movie/{movie_id}/credits",
                params={"api_key": TMDB_API_KEY}
            )
            credits_data = credits_response.json() if credits_response.status_code == 200 else {}
            
            # Get OMDb data for additional ratings
            omdb_data = await self._get_omdb_data(movie_data.get("title"), movie_data.get("release_date", "")[:4])
            
            # Combine all data
            detailed_movie = {
                "id": movie_data["id"],
                "title": movie_data["title"],
                "year": movie_data["release_date"][:4] if movie_data.get("release_date") else "Unknown",
                "overview": movie_data.get("overview", ""),
                "runtime": movie_data.get("runtime", 0),
                "rating_tmdb": movie_data.get("vote_average", 0),
                "rating_imdb": omdb_data.get("imdbRating") if omdb_data else None,
                "rating_rt": omdb_data.get("Ratings", [{}])[1].get("Value") if omdb_data and len(omdb_data.get("Ratings", [])) > 1 else None,
                "genres": [g["name"] for g in movie_data.get("genres", [])],
                "cast": [
                    {"name": actor["name"], "character": actor.get("character", "")}
                    for actor in credits_data.get("cast", [])[:5]
                ],
                "director": next(
                    (crew["name"] for crew in credits_data.get("crew", []) if crew["job"] == "Director"),
                    "Unknown"
                ),
                "poster_url": f"https://image.tmdb.org/t/p/w500{movie_data['poster_path']}" if movie_data.get("poster_path") else None,
                "budget": movie_data.get("budget", 0),
                "revenue": movie_data.get("revenue", 0),
                "production_companies": [comp["name"] for comp in movie_data.get("production_companies", [])],
            }
            
            MOVIE_CACHE[cache_key] = detailed_movie
            return detailed_movie
            
        except Exception as e:
            logger.error(f"Error getting movie details for ID {movie_id}: {e}")
            return None

    async def get_movie_recommendations(self, movie_id: int, limit: int = 5) -> List[Dict]:
        """Get movie recommendations based on a movie"""
        cache_key = f"recommendations_{movie_id}_{limit}"
        if cache_key in MOVIE_CACHE:
            return MOVIE_CACHE[cache_key]

        client = await self._get_client()
        
        try:
            response = await client.get(
                f"{TMDB_BASE_URL}/movie/{movie_id}/recommendations",
                params={"api_key": TMDB_API_KEY, "language": "en-US", "page": 1}
            )
            response.raise_for_status()
            results = response.json()["results"][:limit]
            
            recommendations = []
            for movie in results:
                rec_data = {
                    "id": movie["id"],
                    "title": movie["title"],
                    "year": movie["release_date"][:4] if movie.get("release_date") else "Unknown",
                    "overview": movie.get("overview", ""),
                    "rating": movie.get("vote_average", 0),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                }
                recommendations.append(rec_data)
            
            MOVIE_CACHE[cache_key] = recommendations
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting recommendations for movie {movie_id}: {e}")
            return []

    async def get_genre_recommendations(self, genre: str, year_range: Optional[Tuple[int, int]] = None, limit: int = 10) -> List[Dict]:
        """Get movie recommendations by genre"""
        cache_key = f"genre_{genre}_{year_range}_{limit}"
        if cache_key in MOVIE_CACHE:
            return MOVIE_CACHE[cache_key]

        client = await self._get_client()
        
        # Get genre ID
        genre_id = await self._get_genre_id(genre)
        if not genre_id:
            return []
        
        try:
            params = {
                "api_key": TMDB_API_KEY,
                "with_genres": genre_id,
                "sort_by": "popularity.desc",
                "language": "en-US",
                "page": 1,
                "vote_count.gte": 100,  # Ensure quality movies
            }
            
            if year_range:
                params["primary_release_date.gte"] = f"{year_range[0]}-01-01"
                params["primary_release_date.lte"] = f"{year_range[1]}-12-31"
            
            response = await client.get(f"{TMDB_BASE_URL}/discover/movie", params=params)
            response.raise_for_status()
            results = response.json()["results"][:limit]
            
            movies = []
            for movie in results:
                movie_data = {
                    "id": movie["id"],
                    "title": movie["title"],
                    "year": movie["release_date"][:4] if movie.get("release_date") else "Unknown",
                    "overview": movie.get("overview", ""),
                    "rating": movie.get("vote_average", 0),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                }
                movies.append(movie_data)
            
            MOVIE_CACHE[cache_key] = movies
            return movies
            
        except Exception as e:
            logger.error(f"Error getting genre recommendations for {genre}: {e}")
            return []

    async def search_person(self, name: str) -> Optional[Dict]:
        """Search for a person (actor/director)"""
        cache_key = f"person_{name}"
        if cache_key in PERSON_CACHE:
            return PERSON_CACHE[cache_key]

        client = await self._get_client()
        
        try:
            response = await client.get(
                f"{TMDB_BASE_URL}/search/person",
                params={"api_key": TMDB_API_KEY, "query": name, "language": "en-US"}
            )
            response.raise_for_status()
            results = response.json()["results"]
            
            if not results:
                return None
            
            person = results[0]  # Take best match
            
            # Get person details
            person_response = await client.get(
                f"{TMDB_BASE_URL}/person/{person['id']}",
                params={"api_key": TMDB_API_KEY, "language": "en-US"}
            )
            person_details = person_response.json() if person_response.status_code == 200 else {}
            
            # Get movie credits
            credits_response = await client.get(
                f"{TMDB_BASE_URL}/person/{person['id']}/movie_credits",
                params={"api_key": TMDB_API_KEY, "language": "en-US"}
            )
            credits = credits_response.json() if credits_response.status_code == 200 else {}
            
            person_data = {
                "id": person["id"],
                "name": person["name"],
                "biography": person_details.get("biography", ""),
                "birthday": person_details.get("birthday"),
                "place_of_birth": person_details.get("place_of_birth"),
                "known_for_department": person.get("known_for_department", ""),
                "profile_url": f"https://image.tmdb.org/t/p/w500{person['profile_path']}" if person.get("profile_path") else None,
                "popular_movies": [
                    {
                        "title": movie["title"],
                        "year": movie["release_date"][:4] if movie.get("release_date") else "Unknown",
                        "character": movie.get("character", "")
                    }
                    for movie in credits.get("cast", [])[:5]
                ] if credits.get("cast") else [],
                "directed_movies": [
                    {
                        "title": movie["title"],
                        "year": movie["release_date"][:4] if movie.get("release_date") else "Unknown"
                    }
                    for movie in credits.get("crew", []) if movie.get("job") == "Director"
                ][:5] if credits.get("crew") else []
            }
            
            PERSON_CACHE[cache_key] = person_data
            return person_data
            
        except Exception as e:
            logger.error(f"Error searching for person {name}: {e}")
            return None

    async def get_movie_trivia(self, movie_id: int) -> List[str]:
        """Get movie trivia/facts"""
        # This would ideally come from a trivia API, but we'll use movie details for now
        movie = await self.get_movie_details(movie_id)
        if not movie:
            return []
        
        trivia = []
        
        if movie.get("budget") and movie.get("revenue"):
            profit = movie["revenue"] - movie["budget"]
            if profit > 0:
                trivia.append(f"The movie had a budget of ${movie['budget']:,} and earned ${movie['revenue']:,}, making a profit of ${profit:,}.")
        
        if movie.get("runtime"):
            trivia.append(f"The movie has a runtime of {movie['runtime']} minutes.")
        
        if movie.get("production_companies"):
            trivia.append(f"It was produced by {', '.join(movie['production_companies'][:2])}.")
        
        return trivia[:3]  # Limit to 3 facts

    async def _get_movie_genres(self, movie_id: int) -> List[str]:
        """Get genres for a movie"""
        try:
            client = await self._get_client()
            response = await client.get(
                f"{TMDB_BASE_URL}/movie/{movie_id}",
                params={"api_key": TMDB_API_KEY}
            )
            if response.status_code == 200:
                data = response.json()
                return [g["name"] for g in data.get("genres", [])]
        except Exception as e:
            logger.error(f"Error getting genres for movie {movie_id}: {e}")
        return []

    async def _get_genre_id(self, genre_name: str) -> Optional[int]:
        """Get TMDb genre ID by name"""
        genre_map = {
            "action": 28,
            "adventure": 12,
            "animation": 16,
            "comedy": 35,
            "crime": 80,
            "documentary": 99,
            "drama": 18,
            "family": 10751,
            "fantasy": 14,
            "history": 36,
            "horror": 27,
            "music": 10402,
            "mystery": 9648,
            "romance": 10749,
            "science fiction": 878,
            "sci-fi": 878,
            "thriller": 53,
            "war": 10752,
            "western": 37
        }
        return genre_map.get(genre_name.lower())

    async def _get_omdb_data(self, title: str, year: str) -> Optional[Dict]:
        """Get additional data from OMDb"""
        if not OMDB_API_KEY:
            return None
        
        try:
            client = await self._get_client()
            response = await client.get(
                OMDB_BASE_URL,
                params={"apikey": OMDB_API_KEY, "t": title, "y": year, "plot": "short"}
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("Response") == "True":
                    return data
        except Exception as e:
            logger.error(f"Error getting OMDb data for {title}: {e}")
        return None

# Create global instance
movie_api = MovieAPIService()
