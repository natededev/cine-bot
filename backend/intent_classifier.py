"""
Smart Intent Router for CineBot
Replaces LLM with rule-based intent detection and API-driven responses
"""

import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class Intent(Enum):
    """User intent categories"""
    GREETING = "greeting"
    RECOMMENDATION = "recommendation"
    RECOMMEND = "recommend"
    SEARCH = "search"
    TRIVIA = "trivia"
    DEBATE = "debate"
    ACTOR_INFO = "actor_info"
    DIRECTOR_INFO = "director_info"
    GENRE_QUERY = "genre_query"
    YEAR_QUERY = "year_query"
    RATING_QUERY = "rating_query"
    PLOT_QUERY = "plot_query"
    UNKNOWN = "unknown"

@dataclass
class IntentResult:
    """Result of intent classification"""
    intent: Intent
    confidence: float
    entities: Dict[str, any]
    original_message: str

class IntentClassifier:
    """Rule-based intent classifier for movie-related queries"""
    
    def __init__(self):
        self.patterns = {
            Intent.GREETING: [
                r'\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|yo)\b',
                r'^(hi|hello|hey|sup|yo)$',
                r'\b(how are you|what\'s up|whats up)\b',
            ],
            Intent.RECOMMEND: [
                # Direct recommendation requests
                r'\b(recommend|suggest|advise|propose|pick for me|choose for me)\b',
                r'\b(what should i watch|what to watch|something to watch|what\'s good to watch|what\'s popular)\b',
                r'\b(good movie|great film|best movie|top movie|must-see|worth watching|hidden gem|underrated|overrated)\b',
                r'\b(movie recommendation|film recommendation|movie list|top picks|favorites)\b',
                r'\b(movies like|similar to|in the style of|reminds me of|if I liked|if I enjoyed)\b',
                r'\b(i want to watch|looking for|need something|show me|find me|give me|suggest me)\b.*\b(movie|film)\b',
                r'\b(any suggestions|help me find|got anything|anything fun|anything new|anything trending|anything classic|anything old|anything recent|anything popular)\b',
                r'\b(i\'m bored|bored|nothing to watch|need entertainment|want to relax|want to laugh|want to cry|want to be scared|want to be inspired)\b',
                r'\b(tonight|weekend|date night|with friends|family night|movie night|rainy day|sick day|holiday|vacation)\b.*\b(movie|watch)\b',
                # Natural phrases
                r'\b(what\'s good|whats good|anything good|what\'s trending|trending now|new releases|recently released|classic movies|old movies|timeless|iconic|cult classic)\b',
                r'\b(got any|have any|know any|can you recommend|can you suggest)\b.*\b(movie|film)\b',
                r'any good \w+? films',
                r'got any \w+? movies',
                r'what should i watch',
                r'what do you recommend',
                r'pick a movie for me',
                r'give me something to watch',
                r'anything worth watching',
            ],
            Intent.SEARCH: [
                r'\b(find|search|look for|tell me about|info about|details about|show info|show details|show plot|show cast|show director|show rating|show reviews)\b.*\b(movie|film|about|on|regarding)\b',
                r'\b(what is|who is|when was|where was|who stars in|who directed|who made|who created|who acted in|who played|who\'s in|who\'s starring)\b.*\b(movie|film|about|on|regarding)\b',
                r'"([^"]+)"',  # Quoted movie titles
                r'\b(have you seen|do you know|heard of|tell me about|give me info|give me details|what can you tell me|give me more info|give me more details|what else can you say|elaborate|expand|explain)\b.*\b(movie|film|about|on|regarding)\b',
                r'\b(is there a movie|movie called|film called|movie named|film named)\b',
                r'\b(who stars in|who directed|who made|who created|who acted in|who played|who\'s in|who\'s starring)\b.*',
                r'\b(plot of|story of|summary of|synopsis of|what happens in|what is .+ about|what can you tell me about .+)\b',
                r'\b(who is in .+|who directed .+|when was .+ released|give me details about .+)\b',
            ],
            Intent.TRIVIA: [
                r'\b(trivia|fact|facts|did you know|behind the scenes|interesting|random)\b',
                r'\b(tell me something|fun fact|movie fact|cool fact|interesting fact|any fun facts|any trivia|any interesting details|any secrets|any easter eggs|any hidden details)\b',
                r'\b(surprise me|something interesting|blow my mind|anything else|what else|more info|more details|elaborate|expand|explain)\b',
                r'\b(easter egg|hidden detail|secret)\b',
            ],
            Intent.DEBATE: [
                r'\b(debate|argue|discuss|opinion|think|believe|disagree)\b',
                r'\b(better than|worse than|compare|vs|versus)\b',
                r'\b(overrated|underrated|best|worst)\b',
                r'\b(controversial|unpopular opinion|hot take)\b',
                r'\b(fight|battle|showdown|face-off)\b.*\b(movie|film)\b',
            ],
            Intent.ACTOR_INFO: [
                r'\b(actor|actress|star|starring|cast|who plays|who stars|who\'s in)\b',
                r'\b(acted in|appears in|stars in|featured in)\b',
                r'\b(main character|lead actor|protagonist)\b',
            ],
            Intent.DIRECTOR_INFO: [
                r'\b(director|directed by|filmmaker|made by|created by)\b',
                r'\b(who directed|who made|who created)\b',
            ],
            Intent.GENRE_QUERY: [
                # Explicit genre mentions
                r'\b(action|comedy|drama|horror|romance|sci-fi|science fiction|thriller|fantasy|documentary|animation|crime|mystery|western|biography|musical|adventure|family|war|history|sport)\b',
                # Natural genre requests
                r'\b(funny|hilarious|laugh|humor|comic)\b',  # Comedy
                r'\b(scary|frightening|terrifying|creepy|spooky)\b',  # Horror
                r'\b(romantic|love|relationship|couple|dating)\b',  # Romance
                r'\b(exciting|adrenaline|fast-paced|intense)\b',  # Action
                r'\b(sad|emotional|touching|heartbreaking|tear-jerker)\b',  # Drama
                r'\b(futuristic|space|alien|robot|technology)\b',  # Sci-fi
                r'\b(magical|fantasy|wizard|fairy|mythical)\b',  # Fantasy
                r'\b(real|true story|documentary|based on)\b',  # Documentary
                r'\b(animated|cartoon|pixar|disney)\b',  # Animation
                # Context-based
                r'\b(genre|type|category|kind)\b',
                r'\b(mood for|in the mood|feel like)\b',
            ],
            Intent.YEAR_QUERY: [
                r'\b(year|when|released|came out|made in|from)\b',
                r'\b(19\d{2}|20\d{2})\b',  # Year patterns
                r'\b(recent|new|latest|old|classic|vintage)\b',
                r'\b(90s|80s|70s|60s|2000s|2010s|2020s)\b',
            ],
            Intent.RATING_QUERY: [
                r'\b(rating|score|imdb|rotten tomatoes|critics|review|reviews)\b',
                r'\b(good|bad|worth watching|any good)\b',
                r'\b(popular|highly rated|top rated|best)\b',
            ],
            Intent.PLOT_QUERY: [
                r'\b(plot|story|about|synopsis|summary|premise)\b',
                r'\bwhat.*\b(happens|about|is it)\b',
                r'\b(storyline|narrative|what\'s it about)\b',
            ],
        }

    def classify(self, message: str) -> IntentResult:
        """Classify user message intent"""
        message_lower = message.lower().strip()
        # Score each intent
        intent_scores = {}
        for intent, patterns in self.patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    intent_scores[intent] = intent_scores.get(intent, 0) + 1
        # Pick best intent
        if intent_scores:
            best_intent = max(intent_scores.keys(), key=lambda k: intent_scores[k])
        else:
            best_intent = Intent.UNKNOWN
        entities = self._extract_entities(message, best_intent)

        confidence = intent_scores.get(best_intent, 0) / max(1, sum(intent_scores.values()))
        return IntentResult(
            intent=best_intent,
            confidence=confidence,
            entities=entities,
            original_message=message
        )

    def _extract_entities(self, message: str, intent: Intent) -> Dict[str, any]:
        """Extract entities from message"""
        """Extract entities from message"""
        entities = {}

        # Extract quoted movie titles (single or double quotes)
        quoted = re.findall(r'"([^"]+)"', message)
        if quoted:
            entities["title"] = quoted[0]

        # Extract genres first
        genre_match = re.search(r'\b(action|comedy|drama|horror|romance|sci-fi|science fiction|thriller|fantasy|documentary|animation|crime|mystery|western|biography|musical|adventure|family|war|history|sport)\b', message, re.I)
        if genre_match:
            entities["genre"] = genre_match.group(1).lower()
        
        # Extract movie titles - completely rewritten for reliability
        # Priority 1: Direct "Tell me about X" patterns (most explicit)
        tell_about_match = re.search(r'(?:tell me about|about|plot of|info on|give me info about|what is|details about|info about)\s+(.+?)(?:\?|$|\.)', message, re.I)
        if tell_about_match:
            title = tell_about_match.group(1).strip()
            # Special handling for movie titles with capitalization
            entities["title"] = title
            # Found a direct request
            return entities
                
        # Priority 2: Standalone message matching known movie titles
        # This handles cases when user just types "Your Fault" or "The Gorge"
        # Use this as priority 1 if SEARCH intent
        if len(message.split()) <= 5 and (intent == Intent.SEARCH or len(message.split()) <= 3):
            # For short messages that could be just a movie title
            # Attempt to match with capitalized words - movie titles typically have capitalized words
            if re.search(r'[A-Z]', message):  # Contains at least one capital letter
                entities["title"] = message.strip()
                return entities
                
        # Priority 3: If no direct match, look for capitalized phrases as movie titles
        if not entities.get("title"):
            # This simple heuristic works better than complex regex for titles like "The Gorge"
            if re.match(r'^[A-Z]', message.strip()):  # Message starts with capital letter
                words = message.split()
                if 1 <= len(words) <= 4:  # Short phrase, likely a title
                    entities["title"] = message.strip()
                    return entities
        
        # Pattern 4: Standalone movie titles (when user just says the title)
        if not entities.get("title") and len(message.split()) <= 4:
            # If message is mostly capitalized words, treat as movie title
            words = message.split()
            if words and all(word[0].isupper() or word.lower() in ['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or'] for word in words):
                entities["title"] = message.strip()

        # Extract years
        years = re.findall(r'\b(19\d{2}|20\d{2})\b', message)
        if years:
            entities['year'] = int(years[0])

        # Extract genres with natural language support
        genre_patterns = {
            'action': r'\b(action|adventure|fight|battle|exciting|adrenaline|fast-paced|intense|superhero|martial arts)\b',
            'comedy': r'\b(comedy|funny|humor|laugh|hilarious|comic|witty|light-hearted|amusing)\b',
            'drama': r'\b(drama|dramatic|emotional|touching|heartbreaking|tear-jerker|serious|sad)\b',
            'horror': r'\b(horror|scary|frightening|terror|creepy|spooky|haunted|zombie|ghost)\b',
            'romance': r'\b(romance|romantic|love|relationship|couple|dating|wedding|valentine)\b',
            'sci-fi': r'\b(sci-fi|science fiction|futuristic|space|alien|robot|technology|cyberpunk|dystopian)\b',
            'thriller': r'\b(thriller|suspense|mystery|psychological|crime|detective|investigation)\b',
            'fantasy': r'\b(fantasy|magical|fairy tale|wizard|dragon|medieval|mythical|supernatural)\b',
            'documentary': r'\b(documentary|real|true story|based on|biography|historical|educational)\b',
            'animation': r'\b(animation|animated|cartoon|pixar|disney|anime|claymation)\b',
            'family': r'\b(family|kids|children|wholesome|all ages|disney|pixar)\b',
            'war': r'\b(war|military|battle|soldier|combat|wwii|vietnam|conflict)\b',
            'western': r'\b(western|cowboy|wild west|frontier|gunfighter|saloon)\b',
            'musical': r'\b(musical|singing|songs|broadway|opera|music|dance)\b',
        }
        
        detected_genres = []
        for genre, pattern in genre_patterns.items():
            if re.search(pattern, message.lower()):
                detected_genres.append(genre)
        
        if detected_genres:
            entities['genres'] = detected_genres
        
        # Extract actor/director names (improved)
        # Look for capitalized words (first/last names, up to 3 words)
        potential_names = re.findall(r'([A-Z][a-z]+(?: [A-Z][a-z]+){1,2})', message)
        if potential_names:
            entities['person_names'] = potential_names
        
        return entities
