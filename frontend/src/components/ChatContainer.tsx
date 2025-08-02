import React, { useEffect, useRef, memo, useMemo } from 'react';
import { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  className?: string;
  onMovieSuggestion?: (title: string) => void;
}

/**
 * Optimized EmptyState with lazy loading animations
 */
const EmptyState = memo(() => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-lg animate-fade-in">
        {/* Hero Icon with Glow - optimized */}
        <div className="relative mx-auto w-fit">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-xl will-change-transform"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-3xl flex items-center justify-center border border-purple-500/20 backdrop-blur-sm will-change-transform">
            <Bot className="w-12 h-12 text-purple-400" aria-hidden="true" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Discover your next favorite movie with AI-powered recommendations
          </p>
        </div>
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Message list with aggressive scroll-to-bottom that ALWAYS shows latest message
 */
interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onMovieSuggestion?: (title: string) => void;
}

const MessageList = memo<MessageListProps>(
  ({ messages, isTyping, onMovieSuggestion }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // AGGRESSIVE: Force scroll to bottom with multiple strategies
    const forceScrollToBottom = () => {
      if (containerRef.current) {
        const element = containerRef.current;
        // Strategy 1: Set scrollTop to max
        element.scrollTop = element.scrollHeight;
        
        // Strategy 2: Use scrollTo for browsers that need it
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'auto'
        });
        
        // Strategy 3: Force one more time after a tiny delay for streaming content
        setTimeout(() => {
          if (element) {
            element.scrollTop = element.scrollHeight;
          }
        }, 1);
      }
    };

    // Force scroll after every single render
    useEffect(() => {
      forceScrollToBottom();
    });

    // Force scroll when messages change
    useEffect(() => {
      forceScrollToBottom();
    }, [messages]);

    // Force scroll when typing status changes  
    useEffect(() => {
      forceScrollToBottom();
    }, [isTyping]);

    // Force scroll on mount
    useEffect(() => {
      forceScrollToBottom();
    }, []);

    // Virtualize messages if there are many (performance optimization)
    const visibleMessages = useMemo(() => {
      // For large message counts, only render recent messages
      const maxVisible = 50;
      return messages.length > maxVisible 
        ? messages.slice(-maxVisible) 
        : messages;
    }, [messages]);

    return (
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto px-4 py-6"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'auto' // Instant scroll, no animation
        }}
        onScroll={() => {
          // If user manually scrolls, force back to bottom on next message
          // This ensures latest message is ALWAYS prioritized
        }}
      >
        <div className="space-y-4">
          {/* Load more indicator for virtualized messages */}
          {messages.length > 50 && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              Showing recent {visibleMessages.length} messages
            </div>
          )}

          {/* Optimized message rendering */}
          {visibleMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onMovieSuggestion={onMovieSuggestion}
            />
          ))}

          {/* Enhanced typing indicator with contextual awareness */}
          {isTyping && (
            <div className="will-change-transform">
              <TypingIndicator 
                isVisible={isTyping}
                context={messages.length > 0 ? messages[messages.length - 1]?.content : undefined}
              />
            </div>
          )}

          {/* Extra padding to ensure last message is fully visible */}
          <div className="h-4" aria-hidden="true" />
        </div>
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';

/**
 * Enhanced ChatContainer with performance optimizations
 */
export const ChatContainer = memo<ChatContainerProps>(
  ({ messages, isTyping, className, onMovieSuggestion }) => {
    // Memoize empty state check
    const isEmpty = useMemo(() => messages.length === 0, [messages.length]);

    return (
      <div 
        className={cn(
          'flex flex-col bg-background relative',
          'h-full', // Ensure full height
          className
        )}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <MessageList messages={messages} isTyping={isTyping} onMovieSuggestion={onMovieSuggestion} />
        )}
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
