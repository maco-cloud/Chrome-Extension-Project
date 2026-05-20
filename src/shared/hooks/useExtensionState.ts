import { useCallback, useEffect, useState } from 'react';
import { sendMessage } from '../messaging';
import type { ExtensionState } from '../types';

export function useExtensionState() {
  const [state, setState] = useState<ExtensionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await sendMessage<undefined, ExtensionState>({ type: 'GET_STATE' });
      setState(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load state');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (
        changes.ara_user ||
        changes.ara_usage ||
        changes.ara_subscription ||
        changes.ara_settings
      ) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [refresh]);

  return { state, loading, error, refresh };
}
