import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSuggestions, type Suggestion } from '../api/suggestions';

export type AdminSuggestionsState =
  | { status: 'loading' }
  | { status: 'error' }
  // loadedAt is when the list arrived, in milliseconds, to tell how long a
  // suggestion has been in its status.
  | { status: 'success'; suggestions: Suggestion[]; loadedAt: number };

// A processing without an update for this long was cut in the middle, and
// the API lets it be processed again.
export const STALE_PROCESSING_MS = 10 * 60 * 1000;

// How often the list is requested again while the AI has work to do.
export const POLL_INTERVAL_MS = 5000;

export function isStaleProcessing(
  { status, updatedAt }: Suggestion,
  now: number,
): boolean {
  return (
    status === 'processing' &&
    now - new Date(updatedAt).getTime() > STALE_PROCESSING_MS
  );
}

// Waiting for the AI or being processed by it; a stale processing will not
// finish by itself.
function inProgress(suggestion: Suggestion, now: number): boolean {
  return (
    suggestion.status === 'pending' ||
    (suggestion.status === 'processing' && !isStaleProcessing(suggestion, now))
  );
}

// Every suggestion, newest first. `reload` requests the list again, keeping
// the current one on screen until the new one arrives. While a suggestion is
// in progress the list is requested again by itself, so the draft shows up
// without reloading the page. Once a list is on screen, a failed request
// keeps it there and is tried again, so a network blip does not take the
// list, or the review opened from it, away.
export function useAdminSuggestions(): [AdminSuggestionsState, () => void] {
  const [state, setState] = useState<AdminSuggestionsState>({
    status: 'loading',
  });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const hasList = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let poll: ReturnType<typeof setTimeout> | undefined;

    fetchSuggestions(controller.signal).then(
      (suggestions) => {
        const loadedAt = Date.now();
        hasList.current = true;
        setState({ status: 'success', suggestions, loadedAt });
        if (
          suggestions.some((suggestion) => inProgress(suggestion, loadedAt))
        ) {
          poll = setTimeout(reload, POLL_INTERVAL_MS);
        }
      },
      () => {
        if (controller.signal.aborted) return;
        if (hasList.current) {
          poll = setTimeout(reload, POLL_INTERVAL_MS);
        } else {
          setState({ status: 'error' });
        }
      },
    );

    return () => {
      controller.abort();
      clearTimeout(poll);
    };
  }, [version, reload]);

  return [state, reload];
}
