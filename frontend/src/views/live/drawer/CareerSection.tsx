import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import type { Career, LivePlayer } from "../../../api/types";
import { Chip } from "./Chip";
import { MapStatCard } from "./MapStatCard";
import { RecentMatchCard } from "./RecentMatchCard";
import { Skeleton } from "../../../components/ui/Skeleton";
import { fmtNum, fmtPct } from "../../../lib/format";

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
      <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2">
        {career ? `Last ${recentMatches.length} matches` : "Last matches"}
      </h3>
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
          <div className="grid grid-cols-3 gap-2">
            <Chip label="Record" value={recentRecord} />
            <Chip label="Win rate" value={fmtPct(career.averages.winRate)} />
            <Chip label="Average K/D" value={fmtNum(career.averages.kd, 2)} />
            <Chip label="Average HS%" value={fmtPct(career.averages.hsPct)} />
            <Chip label="Average K/D/A" value={`${fmtNum(career.averages.kills, 1)}/${fmtNum(career.averages.deaths, 1)}/${fmtNum(career.averages.assists, 1)}`} />
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Current Act</h4>
            <div className="grid grid-cols-2 gap-2">
              <Chip label="Games" value={`${player.games}`} />
              <Chip label="Win rate" value={fmtPct(player.winRate)} />
            </div>
          </div>

          {career.agentPool.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Agent pool</h4>
              <div className="flex gap-1.5 flex-wrap">
                {career.agentPool.map((a) => (
                  <div key={a.agent} className="flex items-center gap-1.5 border border-edge rounded-sm pl-1 pr-2 py-1 bg-card">
                    <AgentAvatar portrait={a.portrait} name={a.agent} color={a.color} size={28} />
                    <span className="text-[11px]">{a.agent}</span>
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
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Maps</h4>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
            <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Last matches</h4>
            <div className="space-y-1">
              {recentMatches.map((match) => (
                <RecentMatchCard key={match.matchId} match={match} onOpen={() => onOpenMatch(match.matchId)} />
              ))}
            </div>
          </div>

          {career.coPlayers.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Frequent teammates</h4>
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
