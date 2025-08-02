import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DebateCardProps {
  debate: string;
  timestamp: Date;
}

export const DebateCard = ({ debate, timestamp }: DebateCardProps) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              ⚔️ Movie Debate
            </Badge>
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{debate}</div>
          </div>
        </Card>
        <p className="text-xs text-gray-500 mt-1 px-2">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};
