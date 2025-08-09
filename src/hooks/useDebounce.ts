import { useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash.debounce';

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Create debounced function
  const debouncedCallback = useCallback(
    debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay),
    [delay, ...deps]
  );
  
  // Cleanup
  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);
  
  return debouncedCallback as T;
}