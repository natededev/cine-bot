import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RecommendationsCardProps {
  recommendations: string[];
  timestamp: Date;
  onMovieClick?: (title: string) => void;
}

export const RecommendationsCard = ({ recommendations, timestamp, onMovieClick }: RecommendationsCardProps) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              🎬 Recommendations
            </Badge>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-3 bg-white rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-50"
                onClick={() => onMovieClick?.(rec)}
                role="button"
                tabIndex={0}
                aria-label={`Show details for ${rec}`}
              >
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
        <p className="text-xs text-gray-500 mt-1 px-2">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};
