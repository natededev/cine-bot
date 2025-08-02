/**
 * Debounced auto-save hook for chat persistence
 * Simplified version using localStorage directly
 */

import { useEffect, useRef } from 'react';
import type { ChatState } from '../types';

// Simple localStorage save function
const saveChatSession = (messages: any[]) => {
  try {
    localStorage.setItem('cinebot-chat-messages', JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save chat session to localStorage:', error);
  }
};

export const useDebouncedAutoSave = (chatState: ChatState, delay: number = 1000) => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (chatState.messages.length > 0) {
        saveChatSession(chatState.messages);
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [chatState.messages, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};
