import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Zap, Coffee } from 'lucide-react';

interface ContextualGreetingProps {
  onMoodSelect: (mood: string) => void;
  onGenreSelect: (genre: string) => void;
}

const moodOptions = [
  { id: 'excited', label: 'Excited for Action!', icon: Zap, color: 'text-orange-500' },
  { id: 'romantic', label: 'In the Mood for Love', icon: Heart, color: 'text-pink-500' },
  { id: 'relaxed', label: 'Want Something Chill', icon: Coffee, color: 'text-blue-500' },
  { id: 'surprised', label: 'Surprise Me!', icon: Sparkles, color: 'text-purple-500' },
];

const genreOptions = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Fantasy', 'Documentary'
];

export const ContextualGreeting: React.FC<ContextualGreetingProps> = ({
  onMoodSelect,
  onGenreSelect,
}) => {
  const [showGenres, setShowGenres] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    onMoodSelect(mood);
    setTimeout(() => setShowGenres(true), 500);
  };

  const handleGenreSelect = (genre: string) => {
    onGenreSelect(genre);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">
          🎬 Welcome to CineBot!
        </h2>
        <p className="text-gray-300">
          {!selectedMood 
            ? "What's your movie mood today?" 
            : "Perfect! What genre catches your eye?"
          }
        </p>
      </div>

      {!selectedMood ? (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          {moodOptions.map((mood) => {
            const IconComponent = mood.icon;
            return (
              <Button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                variant="outline"
                className="h-20 flex flex-col items-center gap-2 bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
              >
                <IconComponent className={`h-5 w-5 ${mood.color}`} />
                <span className="text-sm text-center text-white">
                  {mood.label}
                </span>
              </Button>
            );
          })}
        </div>
      ) : showGenres ? (
        <Card className="bg-gray-800/50 border-gray-600 max-w-md w-full">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {genreOptions.map((genre) => (
                <Button
                  key={genre}
                  onClick={() => handleGenreSelect(genre)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  {genre}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
          <span>Getting ready for your perfect recommendations...</span>
        </div>
      )}
    </div>
  );
};
