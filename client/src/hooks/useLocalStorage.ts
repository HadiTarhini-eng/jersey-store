import { useState } from 'react';

/**
 * useState backed by localStorage. Falls back to initialValue when the key
 * doesn't exist or JSON.parse fails.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const next = value instanceof Function ? value(storedValue) : value;
    setStoredValue(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const removeValue = () => {
    setStoredValue(initialValue);
    localStorage.removeItem(key);
  };

  return [storedValue, setValue, removeValue] as const;
}
