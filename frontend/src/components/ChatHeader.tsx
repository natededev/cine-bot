import React, { memo } from 'react';
import { Film, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  className?: string;
  onClearChat?: () => void;
  messageCount?: number;
}

/**
 * Modern ChatHeader component with clear chat functionality
 */
export const ChatHeader = memo<ChatHeaderProps>(({ className, onClearChat, messageCount = 0 }) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50',
        className
      )}
      role="banner"
    >
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Modern Logo */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative flex items-center space-x-4 bg-background rounded-2xl px-6 py-3 border border-border/30">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  CineBot
                </h1>
                <p className="text-xs text-muted-foreground">
                  AI Movie Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Clear Chat Button */}
          {onClearChat && messageCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearChat}
              className="flex items-center gap-2 bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-red-500/50 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Chat
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});

ChatHeader.displayName = 'ChatHeader';
