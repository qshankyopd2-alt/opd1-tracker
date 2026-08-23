import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { backend } from "../api/client";
import type { LiveBoard } from "../api/types";
import { usePoll } from "../hooks/usePoll";

interface LiveData {
  board: LiveBoard | null;
  error: string | null;
  loading: boolean;
  updatedAt: number | null;
  refresh: () => void;
  /** True when the board comes from the real local client. */
  isLive: boolean;
  /** True when the UI should render the board (real local data only). */
  showBoard: boolean;
}

const Ctx = createContext<LiveData | null>(null);

function pollInterval(board: LiveBoard | null): number {
  if (board?.source === "local") {
    return board.state === "INGAME" || board.state === "PREGAME" ? 4000 : 8000;
  }
  return 15000;
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const boardRef = useRef<LiveBoard | null>(null);

  const poll = usePoll<LiveBoard>(
    async () => {
      const board = await backend.live();
      boardRef.current = board;
      return board;
    },
    pollInterval(boardRef.current),
  );

  const value = useMemo<LiveData>(() => {
    const isLive = poll.data?.source === "local";
    return {
      board: poll.data,
      error: poll.error,
      loading: poll.loading,
      updatedAt: poll.updatedAt,
      refresh: poll.refresh,
      isLive,
      showBoard: isLive,
    };
  }, [poll.data, poll.error, poll.loading, poll.updatedAt, poll.refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLiveData(): LiveData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLiveData outside LiveDataProvider");
  return ctx;
}
