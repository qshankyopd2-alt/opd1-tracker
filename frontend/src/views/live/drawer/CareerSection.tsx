import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import type { Career, LivePlayer } from "../../../api/types";
import { MapStatCard } from "./MapStatCard";
import { RecentMatchCard } from "./RecentMatchCard";
import { Skeleton } from "../../../components/ui/Skeleton";
import { fmtNum, fmtPct } from "../../../lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 py-2">
      <div className="truncate text-[8px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-0.5 truncate text-[12px] font-bold text-zinc-100 num">{value}</div>
    </div>
  );
}

export function CareerSection({
  player,
  career,
  careerUsable,
  loading,
  error,
  mapSplashes,
  onOpenMatch,
}: {
  player: LivePlayer;
  career: Career | null;
  careerUsable: boolean;
  loading: boolean;
  error: string | null;
  mapSplashes: Map<string, string>;
  onOpenMatch: (matchId: string) => void;
}) {
  const recentMatches = career?.matches ?? [];
  const recentWins = recentMatches.filter((match) => match.result === "Victory").length;
  const recentLosses = recentMatches.filter((match) => match.result === "Defeat").length;
  const recentDraws = recentMatches.filter((match) => match.result === "Draw").length;
  const recentRecord = career
    ? `${recentWins}W - ${recentLosses}L${recentDraws ? ` - ${recentDraws}D` : ""}`
    : "—";

  return (
    <section data-testid="drawer-career">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Performance</h3>
      {loading && (
        <div className="space-y-1.5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {!loading && (error || !careerUsable) && (
        <p className="text-[12px] text-zinc-500 border border-edge rounded-sm px-3 py-2.5" data-testid="drawer-career-unavailable">
          {error ?? "Career details are unavailable for this player right now."}
        </p>
      )}
      {!loading && careerUsable && career && (
        <div className="space-y-3">
          <div className="overflow-hidden border-y border-edge/70 bg-card/35" data-testid="drawer-performance-grid">
            <div className="grid grid-cols-5 divide-x divide-edge/60">
              <Stat label={`Last ${recentMatches.length} record`} value={recentRecord} />
              <Stat label="Win rate" value={fmtPct(career.averages.winRate)} />
              <Stat label="Average K/D" value={fmtNum(career.averages.kd, 2)} />
              <Stat label="Average HS%" value={fmtPct(career.averages.hsPct)} />
              <Stat label="Average K/D/A" value={`${fmtNum(career.averages.kills, 1)}/${fmtNum(career.averages.deaths, 1)}/${fmtNum(career.averages.assists, 1)}`} />
            </div>
            <div className="flex items-center border-t border-edge/60 px-2 py-1.5">
              <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Current act</span>
              <span className="ml-auto text-[10px] font-semibold text-zinc-300 num">
                <span className="text-zinc-100">{player.games}</span> games
                <span className="mx-2 text-zinc-700">|</span>
                <span className="text-zinc-100">{fmtPct(player.winRate)}</span> win rate
              </span>
            </div>
          </div>

          {career.agentPool.length > 0 && (
            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Agent pool</h4>
              <div className="flex flex-wrap gap-x-3 gap-y-1 rounded-sm bg-card/45 px-2 py-1.5" data-testid="drawer-agent-pool">
                {career.agentPool.map((a) => (
                  <div key={a.agent} className="flex min-w-0 items-center gap-1.5 py-0.5">
                    <AgentAvatar portrait={a.portrait} name={a.agent} color={a.color} size={26} />
                    <span className="text-[11px] font-medium text-zinc-200">{a.agent}</span>
                    <span className="text-[10px] text-zinc-500 num">
                      {a.games}g · {a.winRate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {career.mapStats.length > 0 && (
            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Maps</h4>
              <div className="grid grid-cols-2 overflow-hidden rounded-sm border border-edge/70 bg-card/45" data-testid="drawer-maps">
                {career.mapStats.map((m) => (
                  <MapStatCard
                    key={m.map}
                    map={m.map}
                    games={m.games}
                    winRate={m.winRate}
                    splash={mapSplashes.get(m.map) ?? null}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Last matches</h4>
            <div className="overflow-hidden rounded-sm border border-edge/70 bg-card/45 [&>*:last-child]:border-b-0" data-testid="drawer-match-list">
              {recentMatches.map((match) => (
                <RecentMatchCard key={match.matchId} match={match} onOpen={() => onOpenMatch(match.matchId)} />
              ))}
            </div>
          </div>

          {career.coPlayers.length > 0 && (
            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Frequent teammates</h4>
              <div className="flex flex-wrap gap-1.5">
                {career.coPlayers.map((c) => (
                  <span key={c.puuid} className="text-[11px] border border-edge rounded-sm px-2 py-1 bg-card">
                    {c.name ?? c.puuid.slice(0, 8)}
                    <span className="text-zinc-500 num"> ·{c.sharedMatches}×</span>
                    {c.isParty && <span className="text-brand"> party</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
