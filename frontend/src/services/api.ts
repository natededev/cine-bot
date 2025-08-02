/**
 * CineBot API Service - Updated for API-driven backend
 * No more streaming, pure JSON responses for faster performance
 */

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Request timeout utility
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Types
export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  suggestions?: string[];
  data?: Record<string, unknown>;
  intent?: string;
  response_type?: string;  // 'recommendations', 'trivia', 'debate', or undefined
  processing_time: number;
}

export interface Movie {
  id: number;
  title: string;
  year: string;
  overview: string;
  rating: number;
  poster_url?: string;
  genres?: string[];
}

export interface MovieDetails extends Movie {
  runtime: number;
  rating_tmdb: number;
  rating_imdb?: string;
  rating_rt?: string;
  cast: Array<{ name: string; character: string }>;
  director: string;
  budget?: number;
  revenue?: number;
  production_companies?: string[];
}

export interface Person {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  place_of_birth?: string;
  known_for_department: string;
  profile_url?: string;
  popular_movies: Array<{ title: string; year: string; character?: string }>;
  directed_movies?: Array<{ title: string; year: string }>;
}

export interface MovieSearchRequest {
  query: string;
  year?: number;
  limit?: number;
}

export interface RecommendationRequest {
  genre?: string;
  year?: number;
  movie_id?: number;
  limit?: number;
}

export interface PersonSearchRequest {
  name: string;
}

export interface TriviaRequest {
  movie_id?: number;
  movie_title?: string;
}

class CineBotAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Make a generic API request
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetchWithTimeout(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Send a chat message and get a response
   */
  async chat(
    message: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    const request: ChatRequest = {
      message,
      conversation_id: conversationId,
    };

    console.log('🎬 Sending chat message:', { message, conversationId });
    
    const response = await this.makeRequest<ChatResponse>('/chat', 'POST', request);
    
    console.log('✅ Chat response received:', response);
    return response;
  }

  /**
   * Search for movies
   */
  async searchMovies(request: MovieSearchRequest): Promise<{ movies: Movie[]; total: number; query: string }> {
    return this.makeRequest('/movies/search', 'POST', request);
  }

  /**
   * Get movie details
   */
  async getMovieDetails(movieId: number): Promise<{ movie: MovieDetails }> {
    return this.makeRequest(`/movies/${movieId}`);
  }

  /**
   * Get movie recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<{
    recommendations: Movie[];
    total: number;
    criteria: any;
  }> {
    return this.makeRequest('/movies/recommendations', 'POST', request);
  }

  /**
   * Search for a person (actor/director)
   */
  async searchPerson(request: PersonSearchRequest): Promise<{ person: Person }> {
    return this.makeRequest('/people/search', 'POST', request);
  }

  /**
   * Get movie trivia
   */
  async getTrivia(request: TriviaRequest): Promise<{
    trivia: string[];
    movie: { id: number; title: string; year: string };
  }> {
    return this.makeRequest('/movies/trivia', 'POST', request);
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<{
    conversation_id: string;
    conversation: any;
  }> {
    return this.makeRequest(`/conversations/${conversationId}`);
  }

  /**
   * Clear conversation history
   */
  async clearConversation(conversationId: string): Promise<{ message: string }> {
    return this.makeRequest(`/conversations/${conversationId}`, 'DELETE');
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<{
    status: string;
    service: string;
    version: string;
    timestamp: string;
    apis: Record<string, string>;
  }> {
    return this.makeRequest('/health');
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    active_conversations: number;
    total_messages: number;
    uptime: string;
    version: string;
  }> {
    return this.makeRequest('/stats');
  }

  /**
   * Quick actions for common requests
   */
  async getQuickRecommendations(genre?: string): Promise<Movie[]> {
    const response = await this.getRecommendations({
      genre: genre || 'action',
      limit: 3,
    });
    return response.recommendations;
  }

  async getRandomTrivia(): Promise<string> {
    // Get a random popular movie and fetch its trivia
    const recommendations = await this.getQuickRecommendations();
    if (recommendations.length > 0) {
      const randomMovie = recommendations[Math.floor(Math.random() * recommendations.length)];
      const triviaResponse = await this.getTrivia({ movie_id: randomMovie.id });
      return triviaResponse.trivia[0] || `${randomMovie.title} is a great ${recommendations[0].genres?.[0] || 'movie'} from ${randomMovie.year}!`;
    }
    return "Did you know that the movie industry produces over 2,500 films each year worldwide? 🎬";
  }

  /**
   * Cancel any pending requests (compatibility method)
   */
  cancelRequests(): void {
    // This was used for streaming - no longer needed but kept for compatibility
    console.log('📝 Request cancellation called (no-op in new API)');
  }
}

// Create and export singleton instance
export const cineBotAPI = new CineBotAPI();
export default cineBotAPI;
