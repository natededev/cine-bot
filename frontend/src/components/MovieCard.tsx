import React, { memo, useState, useCallback } from 'react';
import { MovieData } from '@/types';
import { Star, Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: MovieData;
  className?: string;
}

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599999618-1e2e9b7c0cf9?w=300&h=450&fit=crop&crop=center';

/**
 * MovieCard component for displaying movie information with enhanced accessibility
 * Memoized for performance optimization
 */
export const MovieCard = memo<MovieCardProps>(({ movie, className }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const posterSrc = imageError ? FALLBACK_POSTER : movie.poster;
  const altText = `${movie.title} movie poster`;

  return (
    <Card
      className={cn(
        'message-movie-card overflow-hidden transition-cinema hover:shadow-glow',
        className
      )}
      role="article"
      aria-label={`Movie: ${movie.title}`}
    >
      <div className="flex h-36 sm:h-44">
        {/* Poster Image */}
        <div className="w-24 sm:w-32 flex-shrink-0 relative bg-muted">
          {imageLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={posterSrc}
            alt={altText}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imageLoading ? 'opacity-0' : 'opacity-100'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        </div>

        {/* Movie Information */}
        <CardContent className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Title */}
            <h3
              className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 leading-tight"
              title={movie.title}
            >
              {movie.title}
            </h3>

            {/* Metadata Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div
                className="flex items-center gap-1"
                title={`Released in ${movie.year}`}
              >
                <Calendar className="w-3 h-3" aria-hidden="true" />
                <span>{movie.year}</span>
              </div>

              <div
                className="flex items-center gap-1"
                title={`Rating: ${movie.rating} out of 10`}
              >
                <Star
                  className="w-3 h-3 fill-primary text-primary"
                  aria-hidden="true"
                />
                <span>{movie.rating}/10</span>
              </div>

              {movie.runtime && (
                <div
                  className="flex items-center gap-1"
                  title={`Runtime: ${movie.runtime} minutes`}
                >
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span>{movie.runtime}m</span>
                </div>
              )}
            </div>

            {/* Director */}
            {movie.director && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" aria-hidden="true" />
                <span
                  className="truncate"
                  title={`Directed by ${movie.director}`}
                >
                  {movie.director}
                </span>
              </div>
            )}
          </div>

          {/* Genre and Description */}
          <div className="space-y-2 mt-2">
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary hover:bg-primary/30 text-xs px-2 py-1"
            >
              {movie.genre}
            </Badge>

            <p
              className="text-xs text-muted-foreground line-clamp-3 leading-relaxed"
              title={movie.description}
            >
              {movie.description}
            </p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
});

MovieCard.displayName = 'MovieCard';
