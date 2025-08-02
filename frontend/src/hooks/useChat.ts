/**
 * Updated useChat hook for API-driven CineBot
 * Simplified without streaming complexity
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { cineBotAPI, type ChatResponse } from '../services/api';
import { useDebouncedAutoSave } from './useDebouncedAutoSave';
import type { 
  Message, 
  UserMessage, 
  BotMessage, 
  RecommendationsMessage, 
  TriviaMessage, 
  DebateMessage,
  ChatState 
} from '../types';

// Generate unique message IDs
const generateMessageId = (): string => 
  `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Conversation ID management
let conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useChat = () => {
  // Chat state
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    inputValue: '',
  });

  // Track active request for cancellation
  const activeRequestRef = useRef<AbortController | null>(null);

  // Auto-save chat state with debouncing
  useDebouncedAutoSave(chatState, 1000);

  // Memoized messages to prevent unnecessary re-renders
  const messages = useMemo(() => chatState.messages, [chatState.messages]);

  // Main send message function
  const sendMessage = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Cancel any pending request
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }

    // Create abort controller for this request
    const abortController = new AbortController();
    activeRequestRef.current = abortController;

    const userMessage: UserMessage = {
      id: generateMessageId(),
      type: 'user',
      content: trimmedContent,
      timestamp: new Date(),
    };

    // Add user message and show typing indicator
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
      inputValue: '', // Clear input immediately
    }));

    try {
      console.log('🎬 Sending message to API:', trimmedContent);

      // Call the new API
      const response: ChatResponse = await cineBotAPI.chat(trimmedContent, conversationId);

      // Check if request was cancelled
      if (abortController.signal.aborted) {
        console.log('🚫 Request was cancelled');
        return;
      }

      console.log('✅ Received response:', response);

      // Create appropriate message type based on response_type
      let botMessage: Message;
      
      if (response.response_type === 'recommendations') {
        const movies = Array.isArray(response.data?.movies) ? response.data.movies : [];
        botMessage = {
          id: generateMessageId(),
          type: 'recommendations',
          content: response.response,
          timestamp: new Date(),
          recommendations: movies.map((m: any) => m.title)
        } as RecommendationsMessage;
      } else if (response.response_type === 'trivia') {
        botMessage = {
          id: generateMessageId(),
          type: 'trivia',
          content: response.response,
          timestamp: new Date(),
          trivia: response.response
        } as TriviaMessage;
      } else if (response.response_type === 'debate') {
        botMessage = {
          id: generateMessageId(),
          type: 'debate',
          content: response.response,
          timestamp: new Date(),
          debate: response.response
        } as DebateMessage;
      } else {
        botMessage = {
          id: generateMessageId(),
          type: 'bot',
          content: response.response,
          timestamp: new Date(),
          suggestions: response.suggestions,
          data: response.data,
          intent: response.intent,
          processingTime: response.processing_time,
        } as BotMessage;
      }

      // Add bot message and stop typing indicator
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isTyping: false,
      }));

    } catch (error) {
      console.error('❌ Chat error:', error);

      // Only show error if request wasn't cancelled
      if (!abortController.signal.aborted) {
        const errorMessage: BotMessage = {
          id: generateMessageId(),
          type: 'bot',
          content: "I'm sorry, but I'm having trouble right now. Please try again! 🎬",
          timestamp: new Date(),
          suggestions: ['Try again', 'Search for a movie', 'Get recommendations'],
        };

        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isTyping: false,
        }));
      } else {
        // Just stop typing indicator for cancelled requests
        setChatState(prev => ({
          ...prev,
          isTyping: false,
        }));
      }
    } finally {
      // Clean up
      if (activeRequestRef.current === abortController) {
        activeRequestRef.current = null;
      }
    }
  }, []);

  // Quick actions using the new API structure
  const handleQuickAction = useCallback(async (action: 'recommend' | 'trivia' | 'debate') => {
    console.log('🎯 Quick action:', action);
    
    let messageToSend = '';
    switch (action) {
      case 'recommend':
        messageToSend = 'Recommend me some action movies';
        break;
      case 'trivia':
        messageToSend = 'Tell me some fascinating movie trivia and behind-the-scenes facts!';
        break;
      case 'debate':
        messageToSend = 'Start an interesting movie debate topic for us to discuss!';
        break;
      default:
        console.warn('Unknown quick action:', action);
        return;
    }
    await sendMessage(messageToSend);
  }, [sendMessage]);

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback(async (suggestion: string) => {
    console.log('💡 Suggestion clicked:', suggestion);
    await sendMessage(suggestion);
  }, [sendMessage]);

  // Update input value
  const setInputValue = useCallback((value: string) => {
    setChatState(prev => ({
      ...prev,
      inputValue: value,
    }));
  }, []);

  // Clear chat history
  const clearChat = useCallback(() => {
    // Cancel any pending request
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }

    // Generate new conversation ID
    conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Reset state
    setChatState({
      messages: [],
      isTyping: false,
      inputValue: '',
    });

    // Clear from localStorage if using auto-save
    try {
      localStorage.removeItem('cinebot-chat-state');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    console.log('🧹 Chat cleared, new conversation ID:', conversationId);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }
  }, []);

  // Get last bot message for accessing suggestions
  const lastBotMessage = useMemo(() => {
    const botMessages = messages.filter((msg): msg is BotMessage => msg.type === 'bot');
    return botMessages[botMessages.length - 1];
  }, [messages]);

  return {
    // State
    messages,
    isTyping: chatState.isTyping,
    inputValue: chatState.inputValue,
    
    // Actions
    sendMessage,
    handleQuickAction,
    handleSuggestionClick,
    setInputValue,
    clearChat,
    cleanup,
    
    // Computed values
    lastBotMessage,
    conversationId,
    
    // Stats
    messageCount: messages.length,
    userMessageCount: messages.filter(m => m.type === 'user').length,
    botMessageCount: messages.filter(m => m.type === 'bot').length,
  };
};
