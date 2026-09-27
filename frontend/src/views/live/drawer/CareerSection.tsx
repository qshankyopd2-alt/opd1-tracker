import type { Career, LivePlayer } from "../../../api/types";
import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { fmtNum, fmtPct } from "../../../lib/format";
import { FrequentTeammates } from "./FrequentTeammates";
import { MapStatCard } from "./MapStatCard";
import { WeaponLoadoutStrip } from "../../../components/domain/WeaponLoadoutStrip";

export function connectionSummary(
  total: number,
  wins: number,
  losses: number,
  draws = 0,
  explicitPending?: number
): string {
  const resolved = wins + losses + draws;
  const pending = explicitPending ?? Math.max(0, total - resolved);
  const displayTotal = Math.max(total, resolved + pending);
  return `${displayTotal} matches · ${wins}W–${losses}L–${draws}D${
    pending ? ` · ${pending} result${pending === 1 ? "" : "s"} unavailable` : ""
  }`;
}

function ConnectionLine({
  total,
  wins,
  losses,
  draws = 0,
  pending: explicitPending,
}: {
  total: number;
  wins: number;
  losses: number;
  draws?: number;
  pending?: number;
}) {
  const resolved = wins + losses + draws;
  const pending = explicitPending ?? Math.max(0, total - resolved);
  const displayTotal = Math.max(total, resolved + pending);

  return (
    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[12px] font-semibold num">
      <span className="font-display text-text-primary">{displayTotal} matches</span>
      <span className="text-victory">{wins}W</span>
      <span className="text-defeat">{losses}L</span>
      <span className="text-draw">{draws}D</span>
      {pending > 0 && (
        <>
          <span className="text-text-muted">·</span>
          <span className="font-medium text-text-muted text-[11.5px]">
            {pending} result{pending === 1 ? "" : "s"} unavailable
          </span>
        </>
      )}
    </div>
  );
}

function SectionHeading({ label, scope }: { label: string; scope?: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="section-tick" aria-hidden="true" />
      <h3 className="font-display text-[11.5px] font-bold uppercase tracking-[0.12em] text-text-secondary">{label}</h3>
      {scope && <span className="text-[10.5px] font-medium text-text-muted">{scope}</span>}
    </div>
  );
}

function OverviewSection({
  label,
  scope,
  testId,
  children,
}: {
  label: string;
  scope?: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--border-subtle)] py-3 first:pt-0 last:border-b-0 last:pb-0" data-testid={testId}>
      <SectionHeading label={label} scope={scope} />
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function RankEntry({
  label,
  name,
  icon,
  color,
  detail,
}: {
  label: string;
  name: string;
  icon: string | null;
  color: string;
  detail?: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-l-[3px] border-[var(--border-strong)] bg-[var(--bg-inset)] p-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        {icon ? (
          <img
            src={icon}
            alt=""
            className="h-9 w-9 object-contain"
            loading="lazy"
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        ) : (
          <span className="h-5 w-5 rounded-sm border border-edge" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="micro-label">{label}</div>
        <div className="truncate font-display text-[16px] font-bold leading-tight" style={{ color: color || "#f2f5f8" }}>
          {name || "Unknown"}
        </div>
        {detail && (
          <div className="mt-1 inline-block bg-card px-1.5 py-px text-[11px] font-semibold text-text-secondary">{detail}</div>
        )}
      </div>
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
  previousRankIcon,
  previousRankColor,
}: {
  player: LivePlayer;
  career: Career | null;
  careerUsable: boolean;
  loading: boolean;
  error: string | null;
  mapSplashes: Map<string, string>;
  previousRankIcon: string | null;
  previousRankColor: string;
}) {
  const matches = career?.matches ?? [];
  const wins = matches.filter((match) => match.result === "Victory").length;
  const losses = matches.filter((match) => match.result === "Defeat").length;
  const draws = matches.filter((match) => match.result === "Draw").length;
  const encounter = player.encounter;

  return (
    <div className="profile-dossier-grid" data-testid="drawer-career">
      {/* Loadout spans both columns */}
      <div className="profile-dossier-loadout">
        <OverviewSection label="Loadout" scope="Current match" testId="drawer-loadout">
          <WeaponLoadoutStrip weapons={player.weapons} />
        </OverviewSection>
      </div>
      <div className="profile-dossier-column">
        {/* Recent performance — scoped to the recent-match sample */}
        <OverviewSection label="Recent performance" scope={`Last ${matches.length || 8} matches`} testId="drawer-performance-grid">
          {loading ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !careerUsable || !career || error ? (
            <p className="py-2 text-[12px] text-text-secondary" data-testid="drawer-career-unavailable">
              Career details are unavailable for this player right now.
            </p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="micro-label">Results</span>
                <span className="num font-display font-bold">
                  <span className="text-victory">{wins}W</span>
                  <span className="text-draw"> – </span>
                  <span className="text-defeat">{losses}L</span>
                  {draws > 0 && (
                    <>
                      <span className="text-draw"> – </span>
                      <span className="text-draw">{draws}D</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex h-1.5 w-full overflow-hidden rounded-sm bg-inset">
                {matches.length > 0 && (
                  <>
                    <div className="h-full bg-victory transition-all duration-300" style={{ width: `${(wins / matches.length) * 100}%` }} />
                    <div className="h-full bg-draw transition-all duration-300" style={{ width: `${((matches.length - wins - losses) / matches.length) * 100}%` }} />
                    <div className="h-full bg-defeat transition-all duration-300" style={{ width: `${(losses / matches.length) * 100}%` }} />
                  </>
                )}
              </div>

              <div className="profile-kda num" aria-label="Average K/D/A" data-testid="average-kda">
                <div><strong>{fmtNum(career.averages.kills, 1)}</strong><span>Avg kills</span></div>
                <div><strong>{fmtNum(career.averages.deaths, 1)}</strong><span>Avg deaths</span></div>
                <div><strong>{fmtNum(career.averages.assists, 1)}</strong><span>Avg assists</span></div>
              </div>
              <div className="profile-metrics num">
                <div><strong className="text-victory">{fmtPct(career.averages.winRate)}</strong><span>Win rate</span></div>
                <div><strong>{fmtNum(career.averages.kd, 2)}</strong><span>K/D ratio</span></div>
                <div><strong>{fmtPct(career.averages.hsPct)}</strong><span>Headshots</span></div>
              </div>
            </div>
          )}
        </OverviewSection>

        {/* This act — separate scope from the recent sample */}
        <OverviewSection label="This act" scope="Current competitive act" testId="drawer-this-act">
          <div className="grid grid-cols-2 divide-x divide-edge overflow-hidden rounded-sm border border-edge bg-card num">
            <span className="min-w-0 px-3 py-2 text-center">
              <strong className="block font-display text-[15px] font-bold leading-tight text-text-primary">{player.games}</strong>
              <span className="micro-label mt-0.5 block">Matches</span>
            </span>
            <span className="min-w-0 px-3 py-2 text-center">
              <strong className="block font-display text-[15px] font-bold leading-tight text-text-primary">{fmtPct(player.winRate)}</strong>
              <span className="micro-label mt-0.5 block">Win rate</span>
            </span>
          </div>
        </OverviewSection>

        {/* Rank history */}
        <OverviewSection label="Rank history" testId="drawer-rank-chips">
          <div className="grid grid-cols-1 gap-2">
            <RankEntry label="Peak" name={player.peakRank || "Unknown"} icon={player.peakIcon} color={player.peakColor} detail={player.peakAct} />
            <RankEntry label="Previous" name={player.previousRank || "Unknown"} icon={previousRankIcon} color={previousRankColor} />
          </div>
        </OverviewSection>
      </div>
      <div className="profile-dossier-column">
        {/* Most played maps */}
        {careerUsable && career && career.mapStats.length > 0 && (
          <OverviewSection label="Most played maps" testId="drawer-maps">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-2">
              {career.mapStats.map((map) => (
                <MapStatCard
                  key={map.map}
                  map={map.map}
                  games={map.games}
                  winRate={map.winRate}
                  splash={mapSplashes.get(map.map) ?? null}
                />
              ))}
            </div>
          </OverviewSection>
        )}

        {/* Most played agents */}
        {careerUsable && career && career.agentPool.length > 0 && (
          <OverviewSection label="Most played agents" testId="drawer-agent-pool">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-2">
              {career.agentPool.map((agent) => (
                <div
                  key={agent.agent}
                  className="flex min-w-0 flex-col items-center gap-1.5 border border-edge bg-inset px-2 py-2 text-center"
                >
                  <AgentAvatar portrait={agent.portrait} name={agent.agent} color={agent.color} size={26} />
                  <span className="max-w-full truncate font-display text-[13px] font-bold text-text-primary">{agent.agent}</span>
                  <span className="num shrink-0 text-[11.5px] font-medium text-text-muted">
                    {agent.games} {agent.games === 1 ? "match" : "matches"} ·{" "}
                    <span className="font-semibold text-victory">{agent.winRate}%<span className="sr-only"> win rate</span></span>
                  </span>
                </div>
              ))}
            </div>
          </OverviewSection>
        )}

        {/* Frequent teammates */}
        {careerUsable && career && career.coPlayers.length > 0 && (
          <OverviewSection label="Frequent teammates" testId="drawer-frequent-connections">
            <FrequentTeammates teammates={career.coPlayers} embedded />
          </OverviewSection>
        )}

        {/* Connections */}
        {encounter && (encounter.withCount > 0 || encounter.againstCount > 0) && (
          <OverviewSection label="Connections" scope="Shared matches on this account" testId="drawer-encounter">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-sm border border-edge bg-card p-2.5">
                <div className="micro-label">Together</div>
                <ConnectionLine
                  total={encounter.withCount}
                  wins={encounter.winsWith}
                  losses={encounter.lossesWith}
                  draws={encounter.drawsWith}
                  pending={encounter.pendingWith}
                />
              </div>
              <div className="rounded-sm border border-edge bg-card p-2.5">
                <div className="micro-label">Against</div>
                <ConnectionLine
                  total={encounter.againstCount}
                  wins={encounter.winsAgainst}
                  losses={encounter.lossesAgainst}
                  draws={encounter.drawsAgainst}
                  pending={encounter.pendingAgainst}
                />
              </div>
            </div>
          </OverviewSection>
        )}
      </div>
    </div>
  );
}
