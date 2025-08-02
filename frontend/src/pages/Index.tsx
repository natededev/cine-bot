import React, { useEffect } from 'react';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatContainer } from '@/components/ChatContainer';
import { ChatInput } from '@/components/ChatInput';
import { useChat } from '@/hooks/useChat';

/**
 * Main chat page component with proper lifecycle management and persistence
 */
const Index = () => {
  const { messages, isTyping, sendMessage, handleQuickAction, cleanup, clearChat } = useChat();

  // Handler for movie suggestion clicks
  const handleMovieSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div
      className="h-screen bg-background flex flex-col overflow-hidden"
      role="main"
      aria-label="CineBot chat interface"
    >
      <ChatHeader 
        onClearChat={clearChat}
        messageCount={messages.length}
      />
      {/* Chat container with fixed height calculation */}
      <div className="flex-1 relative">
        <ChatContainer
          messages={messages}
          isTyping={isTyping}
          className="absolute inset-0 pb-32" // Account for input height
          onMovieSuggestion={handleMovieSuggestion}
        />
        {/* Input positioned absolutely at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <ChatInput onSendMessage={sendMessage} onQuickAction={handleQuickAction} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
};

export default Index;
