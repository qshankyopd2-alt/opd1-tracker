import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";

interface PollState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  updatedAt: number | null;
  refresh: () => void;
}

/** Polls `fetcher` every `intervalMs` (null = fetch once). Pauses while the window is hidden. */
export function usePoll<T>(fetcher: () => Promise<T>, intervalMs: number | null, deps: unknown[] = []): PollState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const intervalRef = useRef(intervalMs);
  intervalRef.current = intervalMs;

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    const run = async () => {
      try {
        const result = await fetcherRef.current();
        if (!alive) return;
        setData(result);
        setError(null);
        setUpdatedAt(Date.now());
      } catch (err) {
        if (!alive) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      } finally {
        if (alive) {
          setLoading(false);
          schedule();
        }
      }
    };

    const schedule = () => {
      const ms = intervalRef.current;
      if (ms === null) return;
      timer = window.setTimeout(() => {
        if (document.hidden) {
          schedule();
        } else {
          void run();
        }
      }, ms);
    };

    setLoading(true);
    void run();

    const onVisible = () => {
      if (!document.hidden && intervalRef.current !== null) {
        window.clearTimeout(timer);
        void run();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, error, loading, updatedAt, refresh };
}
