'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  fetcher: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: false, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetcher(...args);
      if (!controller.signal.aborted) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (err: any) {
      if (!controller.signal.aborted) {
        const message = err?.message || 'An unexpected error occurred';
        setState({ data: null, loading: false, error: message });
      }
      return null;
    }
  }, [fetcher]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { ...state, execute, reset };
}
