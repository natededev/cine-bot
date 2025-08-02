"""
Response Generator for CineBot
Creates natural, conversational responses using movie data from APIs
"""

import random
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from intent_classifier import Intent, IntentResult
from movie_api_service import movie_api

@dataclass
class ChatResponse:
    """Structured chat response"""
    content: str
    data: Optional[Dict] = None
    suggestions: Optional[List[str]] = None
    response_type: Optional[str] = None  # 'recommendations', 'trivia', 'debate', or None

class ResponseGenerator:
    """Generates natural responses based on intent and movie data"""
    
    def __init__(self):
        self.greeting_responses = [
            "Hello! 🎬 I'm your movie discovery assistant. I can help you find great films, share movie trivia, or discuss your favorite genres. What are you in the mood for?",
            "Hey there! 🎭 Ready to dive into the world of cinema? I can recommend movies, share fascinating facts, or help you explore new genres. What sounds interesting?",
            "Hi! 🍿 I'm here to help you discover amazing movies. Whether you want recommendations, trivia, or just want to chat about films, I'm ready! What can I help you with?",
        ]
        
        self.unknown_responses = [
            "I'm not sure I understood. You can ask for recommendations, trivia, or details about a movie!",
            "Try asking things like: 'Recommend me a comedy', 'Tell me about Inception', 'Who stars in Titanic', or 'Give me a fun fact about movies.'",
            "Need help? Try: 'What should I watch tonight?', 'Show me trending movies', 'Tell me something interesting about movies.'",
        ]

    async def generate_response(self, intent_result: IntentResult) -> ChatResponse:
        """Generate response based on classified intent"""
        try:
            if intent_result.intent == Intent.GREETING:
                return self._handle_greeting()
            
            elif intent_result.intent == Intent.RECOMMEND:
                return await self._handle_recommendation(intent_result)
            
            elif intent_result.intent == Intent.SEARCH:
                return await self._handle_search(intent_result)
            
            elif intent_result.intent == Intent.TRIVIA:
                return await self._handle_trivia(intent_result)
            
            elif intent_result.intent == Intent.DEBATE:
                return await self._handle_debate(intent_result)
            
            elif intent_result.intent == Intent.ACTOR_INFO:
                return await self._handle_actor_info(intent_result)
            
            elif intent_result.intent == Intent.DIRECTOR_INFO:
                return await self._handle_director_info(intent_result)
            
            elif intent_result.intent == Intent.GENRE_QUERY:
                return await self._handle_genre_query(intent_result)
            
            elif intent_result.intent == Intent.PLOT_QUERY:
                return await self._handle_plot_query(intent_result)
            
            elif intent_result.intent == Intent.RATING_QUERY:
                return await self._handle_rating_query(intent_result)
            
            else:
                return self._handle_unknown()
                
        except Exception as e:
            # Log the detailed error for debugging
            import logging
            logging.error(f"Error in generate_response: {str(e)}, intent: {intent_result.intent}")
            return self._handle_unknown()

    def _handle_greeting(self) -> ChatResponse:
        """Handle greeting messages"""
        content = random.choice(self.greeting_responses)
        suggestions = [
            "Recommend me a movie",
            "Tell me some movie trivia",
            "Find action movies from 2023",
            "What's a good comedy to watch?"
        ]
        return ChatResponse(content=content, suggestions=suggestions)

    async def _handle_recommendation(self, intent_result: IntentResult) -> ChatResponse:
        """Handle movie recommendation requests"""
        entities = intent_result.entities
        
        # Check if they specified a genre
        if "genres" in entities:
            genre = entities["genres"][0]
            year_range = None
            
            if "year" in entities:
                year = entities["year"]
                year_range = (year - 2, year + 2)  # 5-year range around specified year
            
            movies = await movie_api.get_genre_recommendations(genre, year_range, limit=3)
            
            if movies:
                content = f"Here are some great {genre} movies I recommend:\n\n"
                for i, movie in enumerate(movies, 1):
                    content += f"{i}. **{movie['title']}** ({movie['year']}) - ⭐ {movie['rating']:.1f}/10\n"
                    content += f"   {movie['overview'][:100]}...\n\n"
                
                content += f"Would you like more {genre} recommendations or details about any of these movies?"
                
                suggestions = [
                    f"Tell me more about {movies[0]['title']}",
                    f"More {genre} movies",
                    "Different genre recommendations"
                ]
                
                return ChatResponse(
                    content=content,
                    data={"movies": movies, "genre": genre},
                    suggestions=suggestions,
                    response_type="recommendations"
                )
        
        # Generic recommendations
        popular_movies = await movie_api.get_genre_recommendations("action", limit=3)
        if popular_movies:
            content = "Here are some popular movies you might enjoy:\n\n"
            for i, movie in enumerate(popular_movies, 1):
                content += f"{i}. **{movie['title']}** ({movie['year']}) - ⭐ {movie['rating']:.1f}/10\n"
                content += f"   {movie['overview'][:100]}...\n\n"
            
            content += "What genre are you in the mood for? I can give you more specific recommendations!"
            
            suggestions = [
                "Comedy movies",
                "Horror films",
                "Romantic movies",
                "Sci-fi recommendations"
            ]
            
            return ChatResponse(
                content=content, 
                suggestions=suggestions,
                response_type="recommendations"
            )
        
        return ChatResponse(
            content="I'd love to recommend some movies! What genre are you interested in? Action, comedy, drama, or something else? 🎬",
            suggestions=["Action movies", "Comedy films", "Drama recommendations"],
            response_type="recommendations"
        )

    async def _handle_search(self, intent_result: IntentResult) -> ChatResponse:
        """Handle movie search requests"""
        entities = intent_result.entities
        
        if "movie_title" in entities:
            title = entities["movie_title"]
            year = entities.get("year")
            
            movies = await movie_api.search_movies(title, year, limit=3)
            
            if movies:
                if len(movies) == 1:
                    # Single result - get detailed info
                    movie = movies[0]
                    details = await movie_api.get_movie_details(movie["id"])
                    
                    if details:
                        content = f"**{details['title']}** ({details['year']})\n\n"
                        content += f"⭐ Rating: {details['rating_tmdb']:.1f}/10 (TMDb)"
                        if details.get("rating_imdb"):
                            content += f" | {details['rating_imdb']}/10 (IMDb)"
                        content += f"\n\n📽️ **Director:** {details['director']}\n"
                        content += f"🎭 **Cast:** {', '.join([actor['name'] for actor in details['cast'][:3]])}\n"
                        content += f"🏷️ **Genres:** {', '.join(details['genres'])}\n"
                        content += f"⏱️ **Runtime:** {details['runtime']} minutes\n\n"
                        content += f"**Plot:** {details['overview']}"
                        
                        suggestions = [
                            f"Movies like {details['title']}",
                            f"More {details['director']} films",
                            "Trivia about this movie"
                        ]
                        
                        return ChatResponse(
                            content=content,
                            data={"movie": details},
                            suggestions=suggestions
                        )
                else:
                    # Multiple results
                    content = f"I found several movies matching '{title}':\n\n"
                    for i, movie in enumerate(movies, 1):
                        content += f"{i}. **{movie['title']}** ({movie['year']}) - ⭐ {movie['rating']:.1f}/10\n"
                        content += f"   {movie['overview'][:80]}...\n\n"
                    
                    content += "Which one are you interested in?"
                    
                    suggestions = [f"Tell me about {movie['title']}" for movie in movies[:3]]
                    
                    return ChatResponse(content=content, data={"movies": movies}, suggestions=suggestions)
            
            return ChatResponse(
                content=f"I couldn't find any movies matching '{title}'. Could you check the spelling or try a different title? 🎬"
            )
        
        return ChatResponse(
            content="What movie are you looking for? Please tell me the title and I'll find it for you! 🔍"
        )

    async def _handle_trivia(self, intent_result: IntentResult) -> ChatResponse:
        """Handle trivia requests"""
        entities = intent_result.entities
        
        if "movie_title" in entities:
            title = entities["movie_title"]
            movies = await movie_api.search_movies(title, limit=1)
            
            if movies:
                movie_id = movies[0]["id"]
                trivia = await movie_api.get_movie_trivia(movie_id)
                
                if trivia:
                    content = f"🎬 **Fun facts about {movies[0]['title']}:**\n\n"
                    for i, fact in enumerate(trivia, 1):
                        content += f"{i}. {fact}\n\n"
                    
                    suggestions = [
                        f"More about {movies[0]['title']}",
                        "Random movie trivia",
                        f"Movies like {movies[0]['title']}"
                    ]
                    
                    return ChatResponse(
                        content=content, 
                        suggestions=suggestions,
                        response_type="trivia"
                    )
        
        # Random trivia from popular movies
        popular_movies = await movie_api.get_genre_recommendations("action", limit=5)
        if popular_movies:
            random_movie = random.choice(popular_movies)
            trivia = await movie_api.get_movie_trivia(random_movie["id"])
            
            if trivia:
                content = f"🎬 **Did you know?** (About {random_movie['title']})\n\n"
                content += trivia[0] if trivia else f"{random_movie['title']} was released in {random_movie['year']} and has a rating of {random_movie['rating']:.1f}/10!"
                
                suggestions = [
                    "More movie trivia",
                    f"Tell me about {random_movie['title']}",
                    "Random movie facts"
                ]
                
                return ChatResponse(
                    content=content, 
                    suggestions=suggestions,
                    response_type="trivia"
                )
        
        return ChatResponse(
            content="I'd love to share some movie trivia! Which movie are you curious about? 🎭",
            response_type="trivia"
        )

    async def _handle_actor_info(self, intent_result: IntentResult) -> ChatResponse:
        """Handle actor information requests"""
        entities = intent_result.entities
        
        if "person_names" in entities:
            actor_name = entities["person_names"][0]
            person_data = await movie_api.search_person(actor_name)
            
            if person_data:
                content = f"🎭 **{person_data['name']}**\n\n"
                
                if person_data.get("biography"):
                    content += f"{person_data['biography'][:200]}...\n\n"
                
                if person_data.get("birthday"):
                    content += f"📅 **Born:** {person_data['birthday']}"
                    if person_data.get("place_of_birth"):
                        content += f" in {person_data['place_of_birth']}"
                    content += "\n\n"
                
                if person_data.get("popular_movies"):
                    content += "🎬 **Popular Movies:**\n"
                    for movie in person_data["popular_movies"][:3]:
                        content += f"• {movie['title']} ({movie['year']})"
                        if movie.get("character"):
                            content += f" as {movie['character']}"
                        content += "\n"
                
                suggestions = [
                    f"More {person_data['name']} movies",
                    "Tell me about their latest film",
                    "Other popular actors"
                ]
                
                return ChatResponse(
                    content=content,
                    data={"person": person_data},
                    suggestions=suggestions
                )
        
        return ChatResponse(
            content="Which actor are you interested in learning about? Please tell me their name! 🎭"
        )

    async def _handle_director_info(self, intent_result: IntentResult) -> ChatResponse:
        """Handle director information requests"""
        entities = intent_result.entities
        
        if "person_names" in entities:
            director_name = entities["person_names"][0]
            person_data = await movie_api.search_person(director_name)
            
            if person_data and person_data.get("directed_movies"):
                content = f"🎬 **{person_data['name']}** (Director)\n\n"
                
                if person_data.get("biography"):
                    content += f"{person_data['biography'][:200]}...\n\n"
                
                content += "🎥 **Directed Films:**\n"
                for movie in person_data["directed_movies"][:5]:
                    content += f"• {movie['title']} ({movie['year']})\n"
                
                suggestions = [
                    f"More {person_data['name']} films",
                    "Tell me about their best movie",
                    "Other famous directors"
                ]
                
                return ChatResponse(
                    content=content,
                    data={"director": person_data},
                    suggestions=suggestions
                )
        
        return ChatResponse(
            content="Which director would you like to know about? Please tell me their name! 🎥"
        )

    async def _handle_genre_query(self, intent_result: IntentResult) -> ChatResponse:
        """Handle genre-specific queries"""
        entities = intent_result.entities
        
        if "genres" in entities:
            genre = entities["genres"][0]
            movies = await movie_api.get_genre_recommendations(genre, limit=5)
            
            if movies:
                content = f"🎬 **Great {genre.title()} Movies:**\n\n"
                for i, movie in enumerate(movies[:3], 1):
                    content += f"{i}. **{movie['title']}** ({movie['year']}) - ⭐ {movie['rating']:.1f}/10\n"
                    content += f"   {movie['overview'][:80]}...\n\n"
                
                content += f"Would you like more {genre} recommendations or details about any of these?"
                
                suggestions = [
                    f"More {genre} movies",
                    f"Best {genre} movies of 2023",
                    "Different genre"
                ]
                
                return ChatResponse(
                    content=content,
                    data={"movies": movies, "genre": genre},
                    suggestions=suggestions,
                    response_type="recommendations"
                )
        
        return ChatResponse(
            content="What genre are you interested in? Action, comedy, horror, romance, sci-fi, or something else? 🎭",
            response_type="recommendations"
        )

    async def _handle_plot_query(self, intent_result: IntentResult) -> ChatResponse:
        """Handle plot/story queries"""
        entities = intent_result.entities
        
        if "movie_title" in entities:
            title = entities["movie_title"]
            movies = await movie_api.search_movies(title, limit=1)
            
            if movies:
                movie = movies[0]
                content = f"**{movie['title']}** ({movie['year']})\n\n"
                content += f"📖 **Plot:** {movie['overview']}"
                
                suggestions = [
                    f"Cast of {movie['title']}",
                    f"Movies like {movie['title']}",
                    "More details about this movie"
                ]
                
                return ChatResponse(content=content, suggestions=suggestions)
        
        return ChatResponse(
            content="Which movie's plot would you like to know about? Please tell me the title! 📖"
        )

    async def _handle_rating_query(self, intent_result: IntentResult) -> ChatResponse:
        """Handle rating queries"""
        entities = intent_result.entities
        
        if "movie_title" in entities:
            title = entities["movie_title"]
            movies = await movie_api.search_movies(title, limit=1)
            
            if movies:
                movie_id = movies[0]["id"]
                details = await movie_api.get_movie_details(movie_id)
                
                if details:
                    content = f"**{details['title']}** ({details['year']}) Ratings:\n\n"
                    content += f"⭐ **TMDb:** {details['rating_tmdb']:.1f}/10\n"
                    
                    if details.get("rating_imdb"):
                        content += f"🎬 **IMDb:** {details['rating_imdb']}/10\n"
                    
                    if details.get("rating_rt"):
                        content += f"🍅 **Rotten Tomatoes:** {details['rating_rt']}\n"
                    
                    # Add context about the rating
                    tmdb_rating = float(details['rating_tmdb'])
                    if tmdb_rating >= 8.0:
                        content += "\n🏆 This is considered an excellent movie!"
                    elif tmdb_rating >= 7.0:
                        content += "\n👍 This is a well-rated movie!"
                    elif tmdb_rating >= 6.0:
                        content += "\n👌 This movie has decent ratings."
                    else:
                        content += "\n📝 This movie has mixed reviews."
                    
                    suggestions = [
                        f"Tell me more about {details['title']}",
                        f"Movies like {details['title']}",
                        "Other highly rated movies"
                    ]
                    
                    return ChatResponse(content=content, suggestions=suggestions)
        
        return ChatResponse(
            content="Which movie's rating would you like to know? Please tell me the title! ⭐"
        )

    async def _handle_debate(self, intent_result: IntentResult) -> ChatResponse:
        """Handle movie debate and discussion requests"""
        entities = intent_result.entities
        
        debate_topics = [
            {
                "title": "Marvel vs DC: Which has better movies?",
                "question": "🦸‍♂️ **Marvel vs DC Debate**\n\nWhich cinematic universe do you think creates better superhero movies and why?",
                "options": ["Marvel has better storytelling", "DC has more depth", "Both are great in different ways"]
            },
            {
                "title": "Sequels vs Originals: Do sequels ruin franchises?",
                "question": "🎬 **Sequels Debate**\n\nDo you think sequels generally enhance or diminish the original movie's legacy?",
                "options": ["Sequels often ruin originals", "Good sequels enhance the story", "It depends on the execution"]
            },
            {
                "title": "Streaming vs Cinema: Is the theater experience dying?",
                "question": "🎭 **Cinema Experience Debate**\n\nWith streaming platforms, do you think the traditional movie theater experience is still important?",
                "options": ["Nothing beats the cinema", "Streaming is more convenient", "Both have their place"]
            },
            {
                "title": "CGI vs Practical Effects: Which creates better movies?",
                "question": "🎨 **Effects Debate**\n\nDo you prefer movies with practical effects or modern CGI, and why?",
                "options": ["Practical effects feel more real", "CGI allows more creativity", "Best when combined well"]
            }
        ]
        
        # If they mentioned specific movies, create a targeted debate
        if "movie_title" in entities:
            title = entities["movie_title"]
            movies = await movie_api.search_movies(title, limit=1)
            
            if movies:
                movie = movies[0]
                content = f"🎬 **Let's debate about {movie['title']}!**\n\n"
                content += f"This {movie['year']} film has a {movie['rating']:.1f}/10 rating. "
                content += "What's your take on it? Is it overrated, underrated, or perfectly rated?\n\n"
                content += f"**{movie['title']}** - What do you think?"
                
                suggestions = [
                    f"{movie['title']} is overrated",
                    f"{movie['title']} is underrated", 
                    f"{movie['title']} is perfectly rated",
                    "Compare it to similar movies"
                ]
                
                return ChatResponse(
                    content=content,
                    data={"movie": movie, "debate_type": "movie_rating"},
                    suggestions=suggestions,
                    response_type="debate"
                )
        
        # Random debate topic
        topic = random.choice(debate_topics)
        content = topic["question"]
        
        return ChatResponse(
            content=content,
            data={"debate_topic": topic},
            suggestions=topic["options"] + ["Different debate topic"],
            response_type="debate"
        )

    def _handle_unknown(self) -> ChatResponse:
        """Handle unknown intents"""
        content = random.choice(self.unknown_responses)
        suggestions = [
            "Recommend a movie",
            "Show me trending movies",
            "Tell me about [movie title]",
            "Who stars in [movie title]",
            "Tell me movie trivia",
            "Find movies by genre",
            "Give me a classic movie",
        ]
        return ChatResponse(content=content, suggestions=suggestions)

# Create global instance
response_generator = ResponseGenerator()
