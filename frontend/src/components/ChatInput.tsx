import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Send, Loader2, ChevronDown, Lightbulb, Brain, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onQuickAction?: (action: 'recommend' | 'trivia' | 'debate', data?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MAX_MESSAGE_LENGTH = 500;
const PLACEHOLDER_SUGGESTIONS = [
  'Ask me about movies...',
  'What should I watch tonight?',
  'Recommend me a thriller...',
  'Any good sci-fi films?',
  'Tell me about classic movies...',
];

// Debounce utility for input optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Mobile detection hook
function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Optimized ChatInput component with debouncing and performance enhancements
 */
export const ChatInput = ({
  onSendMessage,
  onQuickAction,
  disabled = false,
  placeholder,
  className,
}: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(
    placeholder || PLACEHOLDER_SUGGESTIONS[0]
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input value for performance
  const debouncedInputValue = useDebounce(inputValue, 100);
  const isMobile = useMobile();

  // Memoize validation checks
  const { isValid, trimmedValue, charCount } = useMemo(() => {
    const trimmed = debouncedInputValue.trim();
    return {
      isValid: trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH,
      trimmedValue: trimmed,
      charCount: debouncedInputValue.length,
    };
  }, [debouncedInputValue]);

  // Optimized placeholder cycling
  useEffect(() => {
    if (placeholder) return;

    const interval = setInterval(() => {
      setCurrentPlaceholder(prev => {
        const currentIndex = PLACEHOLDER_SUGGESTIONS.indexOf(prev);
        const nextIndex = (currentIndex + 1) % PLACEHOLDER_SUGGESTIONS.length;
        return PLACEHOLDER_SUGGESTIONS[nextIndex];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [placeholder]);

  // Optimized input change handler with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setInputValue(value);
    }
  }, []);

  // Optimized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || disabled || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSendMessage(trimmedValue);
      setInputValue('');
      
      // Focus input after successful submission
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, trimmedValue, disabled, isSubmitting, onSendMessage]);

  // Optimized focus handler for mobile
  const handleInputFocus = useCallback(() => {
    // Prevent aggressive scrolling on mobile
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Wait for keyboard animation
    }
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const syntheticEvent = e as unknown as React.FormEvent;
      handleSubmit(syntheticEvent);
    }
  }, [handleSubmit]);

  // Memoize UI state
  const uiState = useMemo(() => ({
    isDisabled: disabled || isSubmitting,
    isNearLimit: charCount > MAX_MESSAGE_LENGTH * 0.8,
    showCharCount: charCount > MAX_MESSAGE_LENGTH * 0.6,
  }), [disabled, isSubmitting, charCount]);

  return (
    <div
      className={cn(
        'bg-background/80 backdrop-blur-xl border-t border-border/30 p-6 pb-8 safe-bottom',
        className
      )}
    >
      <form onSubmit={handleSubmit} className="container mx-auto max-w-4xl">
        <div className="relative">
          {/* Gemini-style input container */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-muted/30 rounded-2xl border border-border/30 backdrop-blur-sm">
              
              {/* Action buttons row - Above text input (always visible) */}
              {onQuickAction && !disabled && (
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  {/* Desktop: Show action buttons */}
                  {!isMobile ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuickAction?.('recommend')}
                        className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
                      >
                        <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                        Recommendations
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuickAction?.('trivia')}
                        className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
                      >
                        <Brain className="w-3.5 h-3.5 mr-1.5" />
                        Trivia
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuickAction?.('debate')}
                        className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
                      >
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        Debate
                      </Button>
                    </div>
                  ) : (
                    /* Mobile: Show dropdown without plus icon */
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => onQuickAction?.('recommend')}>
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Get Recommendations
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onQuickAction?.('trivia')}>
                          <Brain className="w-4 h-4 mr-2" />
                          Random Trivia
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onQuickAction?.('debate')}>
                          <Users className="w-4 h-4 mr-2" />
                          Start Debate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}

              {/* Text input row */}
              <div className={cn(
                "flex items-center px-4",
                onQuickAction ? "pb-3" : "py-3" // Less bottom padding when action buttons are present
              )}>
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  placeholder={currentPlaceholder}
                  className={cn(
                    'border-0 bg-transparent rounded-2xl text-base py-4 h-14 flex-1',
                    'placeholder:text-muted-foreground/60 transition-all duration-200',
                    uiState.isNearLimit && 'text-yellow-400'
                  )}
                  aria-label="Type your message about movies"
                  autoComplete="off"
                  spellCheck="true"
                />
                
                {/* Character count */}
                {uiState.showCharCount && (
                  <span
                    className={cn(
                      'text-xs mr-3',
                      'pointer-events-none transition-colors',
                      uiState.isNearLimit ? 'text-yellow-400' : 'text-muted-foreground/40'
                    )}
                    aria-live="polite"
                  >
                    {charCount}/{MAX_MESSAGE_LENGTH}
                  </span>
                )}

                {/* Send button */}
                <Button
                  type="submit"
                  disabled={!isValid || uiState.isDisabled}
                  className={cn(
                    'rounded-xl h-11 w-11 p-0 border-0 ml-2',
                    'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
                    'shadow-lg hover:shadow-xl transition-all duration-200',
                    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-lg'
                  )}
                  aria-label="Send message"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-5 h-5" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Help text - Always visible */}
          <p
            id="chat-input-help"
            className="text-xs text-muted-foreground/50 mt-3 text-center"
          >
            Press Enter to send • Shift+Enter for new line
          </p>


        </div>
      </form>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ChatInput);

ChatInput.displayName = 'ChatInput';