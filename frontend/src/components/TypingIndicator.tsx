import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
  context?: string;
  userPreferences?: {
    mood?: string;
    genres?: string[];
  };
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isVisible, 
  context,
  userPreferences 
}) => {
  if (!isVisible) return null;

  // Generate contextual thinking message
  const getContextualMessage = () => {
    if (userPreferences?.mood && userPreferences?.genres?.length) {
      const mood = userPreferences.mood;
      const genre = userPreferences.genres[0];
      return `Finding perfect ${genre} movies for your ${mood} mood...`;
    } else if (context && context.includes('recommend')) {
      return `Searching for great movie recommendations...`;
    } else if (context && context.includes('trivia')) {
      return `Finding fascinating movie trivia...`;
    } else if (context && context.includes('debate')) {
      return `Preparing movie discussion points...`;
    } else if (context && (context.includes('sci-fi') || context.includes('science fiction'))) {
      return `Exploring sci-fi movie databases...`;
    } else if (context && context.includes('tonight')) {
      return `Finding tonight's perfect movie...`;
    } else {
      return `CineBot is thinking...`;
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
      </div>
      <span className="text-sm text-gray-300 italic">
        {getContextualMessage()}
      </span>
      <div className="flex items-center space-x-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse [animation-delay:0.5s]"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse [animation-delay:1s]"></div>
      </div>
    </div>
  );
};

TypingIndicator.displayName = 'TypingIndicator';
