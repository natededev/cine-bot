import React, { memo } from 'react';
import { Message } from '@/types';
import { MovieCard } from './MovieCard';
import { RecommendationsCard } from './RecommendationsCard';
import { TriviaCard } from './TriviaCard';
import { DebateCard } from './DebateCard';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  onMovieSuggestion?: (title: string) => void;
}

/**
 * MessageBubble component for displaying chat messages with accessibility support
 * Memoized for performance optimization
 */
export const MessageBubble = memo<MessageBubbleProps>(({ message, onMovieSuggestion }) => {
  const isUser = message.type === 'user';
  const isMovieCard = message.type === 'movieCard';
  const isRecommendations = message.type === 'recommendations';
  const isTrivia = message.type === 'trivia';
  const isDebate = message.type === 'debate';

  // Handler for clicking a recommended movie
  const handleMovieClick = (title: string) => {
    if (onMovieSuggestion) {
      onMovieSuggestion(`Tell me about ${title}`);
    }
  };

  // Ensure timestamp is a Date object (fix for localStorage persistence)
  const timestamp = message.timestamp instanceof Date 
    ? message.timestamp 
    : new Date(message.timestamp);

  // Format timestamp for accessibility
  const formattedTime = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isoTimestamp = timestamp.toISOString();

  // Handle special message types
  if (isMovieCard && 'movieData' in message && message.movieData) {
    return (
      <div
        className="flex justify-start mb-6 animate-fade-in group"
        role="article"
        aria-label={`Movie recommendation: ${message.movieData.title}`}
      >
        <div className="max-w-md w-full transition-transform duration-200 group-hover:scale-[1.02]">
          <MovieCard movie={message.movieData} />
        </div>
      </div>
    );
  }

  if (isRecommendations && 'recommendations' in message) {
    return <RecommendationsCard recommendations={message.recommendations} timestamp={message.timestamp} onMovieClick={handleMovieClick} />;
  }

  if (isTrivia && 'trivia' in message) {
    return <TriviaCard trivia={message.trivia} timestamp={message.timestamp} />;
  }

  if (isDebate && 'debate' in message) {
    return <DebateCard debate={message.debate} timestamp={message.timestamp} />;
  }

  return (
    <div
      className={cn(
        'flex mb-4 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Bot'} message`}
    >
      <div
        className={cn(
          'max-w-xs sm:max-w-md lg:max-w-lg px-5 py-4 rounded-3xl transition-all duration-300 cursor-default group',
          isUser 
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-lg shadow-lg hover:shadow-xl hover:scale-[1.02]' 
            : 'bg-muted/50 text-foreground rounded-bl-lg border border-border/30 backdrop-blur-sm hover:bg-muted/70 hover:border-border/50 hover:shadow-md'
        )}
      >
        <p
          className="text-sm leading-relaxed"
          role="text"
          aria-label={isUser ? 'Your message' : 'Bot response'}
        >
          {message.content}
        </p>
        <time
          className="text-xs opacity-70 mt-1 block group-hover:opacity-90 transition-opacity duration-200"
          dateTime={isoTimestamp}
          aria-label={`Sent at ${formattedTime}`}
        >
          {formattedTime}
        </time>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
