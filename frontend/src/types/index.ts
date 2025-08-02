// Core message types
export type MessageType = 'user' | 'bot' | 'movieCard' | 'recommendations' | 'trivia' | 'debate';

export interface BaseMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
}

export interface BotMessage extends BaseMessage {
  type: 'bot';
  suggestions?: string[];
  data?: Record<string, unknown>;
  intent?: string;
  processingTime?: number;
}

export interface MovieCardMessage extends BaseMessage {
  type: 'movieCard';
  movieData: MovieData;
}

export interface RecommendationsMessage extends BaseMessage {
  type: 'recommendations';
  recommendations: string[];
}

export interface TriviaMessage extends BaseMessage {
  type: 'trivia';
  trivia: string;
}

export interface DebateMessage extends BaseMessage {
  type: 'debate';
  debate: string;
}

export type Message = UserMessage | BotMessage | MovieCardMessage | RecommendationsMessage | TriviaMessage | DebateMessage;

// Movie data types
export interface MovieData {
  title: string;
  year: number;
  poster: string;
  rating: number;
  genre: string;
  description: string;
  imdbId?: string;
  director?: string;
  cast?: string[];
  runtime?: number;
}

// Chat state types
export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  inputValue: string;
}

// API response types
export interface BotResponse {
  content: string;
  movieData?: MovieData;
}

// UI Props types
export interface ComponentBaseProps {
  className?: string;
  children?: React.ReactNode;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
