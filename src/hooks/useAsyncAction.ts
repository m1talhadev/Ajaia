"use client";

import { useCallback, useState } from "react";
import { errorMessage } from "@/lib/api";

// Runs async UI actions, tracking whether one is in progress and the last error.
// `onError` runs before the error is shown, e.g. to roll back an optimistic update.
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(action: () => Promise<T>, onError?: () => void): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (e) {
      onError?.();
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
