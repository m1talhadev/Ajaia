"use client";

import { useEffect, useState } from "react";

// useState persisted to localStorage. Starts from `initial` on the server and
// first render, then picks up the stored value. Storage can be unavailable
// (e.g. private browsing), in which case the value just isn't remembered.
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // Storage unavailable.
    }
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
