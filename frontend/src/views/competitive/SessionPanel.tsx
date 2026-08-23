import { useState } from "react";
import { Flag, Play, RotateCcw } from "lucide-react";
import { backend } from "../../api/client";
import type { SessionView } from "../../api/types";
import { fmtDelta, timeAgo } from "../../lib/format";

export function SessionPanel({
  active,
  archive,
  onChanged,
  canControl,
}: {
  active: SessionView | null;
  archive: SessionView[];
  onChanged: () => void;
  canControl: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const act = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fn();
      if (!res.ok) setMessage(res.message ?? "Action failed.");
      onChanged();
    } catch {
      setMessage("Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const summary = active?.summary;
  const net = summary?.net ?? active?.net ?? 0;

  return (
    <div data-testid="session-panel">
      {active ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Session net</div>
              <div className={`font-display font-black text-2xl num ${net >= 0 ? "text-victory" : "text-defeat"}`}>
                {fmtDelta(net)} RR
              </div>
            </div>
            <div className="text-[12px] text-zinc-400 num">
              {summary ? `${summary.wins}W–${summary.losses}L` : `${active.points.length} matches`}
              <div className="text-[10px] text-zinc-600">started {timeAgo(active.startedAt)}</div>
            </div>
            {canControl && (
              <button
                data-testid="session-new-button"
                disabled={busy}
                onClick={() => act(() => backend.sessionEnd())}
                title="Archive this session and begin a fresh one"
                className="ml-auto inline-flex items-center gap-1.5 border border-edge rounded-sm px-2.5 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={11} /> New session
              </button>
            )}
          </div>
          {active.points.length > 0 && (
            <div className="flex gap-1 flex-wrap" data-testid="session-points">
              {active.points.map((p) => (
                <span
                  key={p.matchId}
                  title={`${p.map ?? ""} ${typeof p.delta === "number" ? fmtDelta(p.delta) : ""}`}
                  className={`w-5 h-5 rounded-[3px] text-[9px] font-bold flex items-center justify-center ${
                    p.result === "Victory" ? "bg-victory/20 text-victory" : p.result === "Defeat" ? "bg-defeat/20 text-defeat" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {p.result === "Victory" ? "W" : p.result === "Defeat" ? "L" : "·"}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-[12px] text-zinc-500 flex-1">
            No active session. Sessions group tonight's competitive matches and track net RR.
          </p>
          {canControl && (
            <button
              data-testid="session-start-button"
              disabled={busy}
              onClick={() => act(() => backend.sessionStart())}
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-ink rounded-sm px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold transition-colors disabled:opacity-50"
            >
              <Play size={11} /> Start session
            </button>
          )}
        </div>
      )}

      {message && <p className="text-[11px] text-amber-300 mt-2">{message}</p>}

      {archive.length > 0 && (
        <div className="mt-3 border-t border-edge pt-2.5">
          <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5 inline-flex items-center gap-1">
            <Flag size={10} /> Previous sessions
          </h4>
          <div className="space-y-1" data-testid="session-archive">
            {archive.slice(0, 5).map((s, i) => {
              const sNet = s.summary?.net ?? s.net ?? 0;
              return (
                <div key={s.id ?? i} className="flex items-center gap-3 text-[11px] text-zinc-400 num">
                  <span>{timeAgo(s.startedAt)}</span>
                  <span>{s.summary ? `${s.summary.wins}W–${s.summary.losses}L` : `${s.points.length} matches`}</span>
                  <span className={`ml-auto font-semibold ${sNet >= 0 ? "text-victory" : "text-defeat"}`}>{fmtDelta(sNet)} RR</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
