import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '../useChat';

// Mock setTimeout and clearTimeout
vi.mock('global', () => ({
  setTimeout: vi.fn(),
  clearTimeout: vi.fn(),
}));

describe('useChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('initializes with empty messages and not typing', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isTyping).toBe(false);
  });

  it('adds user message and sets typing state', async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].type).toBe('user');
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.isTyping).toBe(true);
  });

  it('generates bot response after delay', async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('recommend a movie');
    });

    expect(result.current.isTyping).toBe(true);

    // Fast forward timers
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    expect(result.current.messages.length).toBeGreaterThan(1);

    const botMessage = result.current.messages.find(m => m.type === 'bot');
    expect(botMessage).toBeTruthy();
    expect(botMessage?.content).toBeTruthy();
  });

  it('generates movie recommendation for recommendation requests', async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('recommend me a movie');
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    const movieMessage = result.current.messages.find(
      m => m.type === 'movieCard'
    );
    expect(movieMessage).toBeTruthy();
    expect('movieData' in movieMessage! && movieMessage.movieData).toBeTruthy();
  });

  it('trims whitespace from input', async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('  hello  ');
    });

    expect(result.current.messages[0].content).toBe('hello');
  });

  it('ignores empty messages', async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('');
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isTyping).toBe(false);
  });

  it('provides cleanup function', () => {
    const { result } = renderHook(() => useChat());

    expect(typeof result.current.cleanup).toBe('function');
  });

  it('generates genre-specific recommendations', async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('I want a thriller movie');
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    const botMessage = result.current.messages.find(m => m.type === 'bot');
    expect(botMessage?.content.toLowerCase()).toContain('thriller');
  });
});
