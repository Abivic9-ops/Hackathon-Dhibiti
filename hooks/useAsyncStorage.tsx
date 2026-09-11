import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage-backed state that mirrors one key and writes it through on
 * every update; `removeValue` clears the key. Loading is surfaced so callers
 * do not flash persisted values as fresh defaults.
 */
export function useAsyncStorage<T>(
  key: string,
  initialValue?: T,
): [T | null, (value: T | null) => Promise<void>, () => Promise<void>, boolean] {
  const [storedValue, setStoredValue] = useState<T | null>(initialValue ?? null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial value from storage
  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        } else if (initialValue !== undefined) {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(`Error loading ${key} from AsyncStorage:`, error);
        if (initialValue !== undefined) {
          setStoredValue(initialValue);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadStoredValue();
  }, [key, initialValue]);

  // Set value in storage
  const setValue = useCallback(
    async (value: T | null) => {
      try {
        setStoredValue(value);
        if (value === null) {
          await AsyncStorage.removeItem(key);
        } else {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error(`Error setting ${key} in AsyncStorage:`, error);
        throw error;
      }
    },
    [key],
  );

  // Remove value from storage
  const removeValue = useCallback(async () => {
    try {
      setStoredValue(null);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from AsyncStorage:`, error);
      throw error;
    }
  }, [key]);

  return [storedValue, setValue, removeValue, isLoading];
}
