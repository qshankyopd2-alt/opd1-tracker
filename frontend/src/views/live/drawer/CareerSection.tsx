import type { Career, LivePlayer } from "../../../api/types";
import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { fmtNum, fmtPct } from "../../../lib/format";
import { FrequentTeammates } from "./FrequentTeammates";
import { MapStatCard } from "./MapStatCard";

const FEATURED_WEAPONS = ["Vandal", "Phantom", "Operator", "Melee"] as const;

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

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="h-3 w-1 rounded-full bg-[var(--text-muted)]" />
      <h3 className="text-[13px] font-semibold text-[var(--text-secondary)]">
        {label}
      </h3>
    </div>
  );
}

function OverviewSection({
  label,
  testId,
  children,
}: {
  label: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--border-subtle)] py-3 first:pt-0 last:border-b-0 last:pb-0" data-testid={testId}>
      <SectionHeading label={label} />
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
    <div className="flex min-w-0 items-center gap-3 border-l-2 border-[var(--border-strong)] bg-[var(--bg-app)] p-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        {icon ? (
          <img
            src={icon}
            alt=""
            className="h-9 w-9 object-contain"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="h-5 w-5 rounded-full border border-edge" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-zinc-400">{label}</div>
        <div className="truncate font-display text-[18px] font-semibold leading-tight" style={{ color: color || "#E4E4E7" }}>
          {name || "Unknown"}
        </div>
        {detail && (
          <div className="mt-1 inline-block bg-[var(--bg-card)] px-1.5 py-0.5 text-[12px] font-semibold text-[var(--text-secondary)]">
            {detail}
          </div>
        )}
      </div>
    </div>
  );
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
      <span className="text-zinc-200 font-semibold">{displayTotal} matches</span>
      <span className="text-victory font-semibold">{wins}W</span>
      <span className="text-defeat font-semibold">{losses}L</span>
      <span className="text-zinc-400 font-semibold">{draws}D</span>
      {pending > 0 && (
        <>
          <span className="text-zinc-600">·</span>
          <span className="font-medium text-zinc-400 text-[12px]">
            {pending} result{pending === 1 ? "" : "s"} unavailable
          </span>
        </>
      )}
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


  const featuredWeapons = FEATURED_WEAPONS.map((weapon) => ({
    weapon,
    item: player.weapons.find((item) => item.weapon === weapon),
  }));
  const encounter = player.encounter;

  return (
    <div className="profile-dossier-grid" data-testid="drawer-career">
      <div className="profile-dossier-column">
      {/* 1. Rank History */}
      <OverviewSection label="Rank history" testId="drawer-rank-chips">
        <div className="grid grid-cols-2 gap-2">
          <RankEntry
            label="Peak"
            name={player.peakRank || "Unknown"}
            icon={player.peakIcon}
            color={player.peakColor}
            detail={player.peakAct}
          />
          <RankEntry
            label="Previous"
            name={player.previousRank || "Unknown"}
            icon={previousRankIcon}
            color={previousRankColor}
          />
        </div>
      </OverviewSection>

      {/* 2. Frequent Teammates */}
      {careerUsable && career && career.coPlayers.length > 0 && (
        <OverviewSection label="Frequent teammates" testId="drawer-frequent-connections">
          <FrequentTeammates teammates={career.coPlayers} embedded />
        </OverviewSection>
      )}

      {/* 3. Performance */}
      <OverviewSection label="Performance" testId="drawer-performance-grid">
        {loading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !careerUsable || !career || error ? (
          <p className="py-2 text-[12px] text-zinc-400" data-testid="drawer-career-unavailable">
            Career details are unavailable for this player right now.
          </p>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-zinc-400">
                Last 8 matches
              </span>
              <span className="text-[12px] font-semibold text-zinc-400">
                {wins}W – {losses}L{draws > 0 ? ` · ${draws}D` : ""}
              </span>
            </div>

            {/* Visual Win Ratio Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800 flex">
              {matches.length > 0 && (
                <>
                  <div
                    className="h-full bg-victory transition-all duration-300"
                    style={{ width: `${(wins / matches.length) * 100}%` }}
                  />
                  <div
                    className="h-full bg-zinc-500 transition-all duration-300"
                    style={{ width: `${((matches.length - wins - losses) / matches.length) * 100}%` }}
                  />
                  <div
                    className="h-full bg-defeat transition-all duration-300"
                    style={{ width: `${(losses / matches.length) * 100}%` }}
                  />
                </>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 divide-x divide-edge overflow-hidden rounded-md border border-edge bg-card">
              <div className="p-2 text-center">
                <span className="block font-display text-[20px] font-semibold leading-none text-zinc-100 num">
                  {wins}W–{losses}L{draws > 0 ? ` · ${draws}D` : ""}
                </span>
                <span className="mt-1.5 block text-[12px] font-semibold text-zinc-400">
                  Record
                </span>
              </div>
              <div className="p-2 text-center">
                <span className="block font-display text-[18px] font-semibold leading-none text-victory num">
                  {fmtPct(career.averages.winRate)}
                </span>
                <span className="mt-1.5 block text-[12px] font-semibold text-zinc-400">
                  Win rate
                </span>
              </div>
              <div className="p-2 text-center">
                <span className="block font-mono text-[16px] font-semibold leading-none text-zinc-300 num">
                  {fmtNum(career.averages.kd, 2)}
                </span>
                <span className="mt-1.5 block text-[12px] font-semibold text-zinc-400">
                  K/D
                </span>
              </div>
              <div className="p-2 text-center">
                <span className="block font-mono text-[16px] font-semibold leading-none text-zinc-300 num">
                  {fmtPct(career.averages.hsPct)}
                </span>
                <span className="mt-1.5 block text-[12px] font-semibold text-zinc-400">
                  Headshots
                </span>
              </div>
            </div>

            {/* Season Summary Strip */}
            <div className="grid grid-cols-[72px_minmax(0,1fr)] items-stretch overflow-hidden rounded-md border border-edge bg-card num">
              <span className="flex items-center border-r border-edge px-3 text-[12px] font-semibold text-zinc-300">
                This act
              </span>
              <div className="grid min-w-0 grid-cols-[0.75fr_0.8fr_1.45fr] divide-x divide-edge">
                <span className="min-w-0 px-3 py-2">
                  <strong className="block text-[14px] font-semibold leading-tight text-zinc-100">{player.games}</strong>
                  <span className="mt-0.5 block text-[12px] text-zinc-400">Matches</span>
                </span>
                <span className="min-w-0 px-3 py-2">
                  <strong className="block text-[14px] font-semibold leading-tight text-zinc-100">{fmtPct(player.winRate)}</strong>
                  <span className="mt-0.5 block text-[12px] text-zinc-400">Win rate</span>
                </span>
                <span className="min-w-0 px-3 py-2">
                  <strong className="block truncate text-[14px] font-semibold leading-tight text-zinc-100">
                    {fmtNum(career.averages.kills, 1)} / {fmtNum(career.averages.deaths, 1)} / {fmtNum(career.averages.assists, 1)}
                  </strong>
                  <span className="mt-0.5 block text-[12px] text-zinc-400">Average K/D/A</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </OverviewSection>

      </div>
      <div className="profile-dossier-column">

      {/* 4. Most Played Agents */}
      {careerUsable && career && career.agentPool.length > 0 && (
        <OverviewSection label="Most played agents" testId="drawer-agent-pool">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-edge [&>*:last-child:nth-child(odd)]:col-span-2">
            {career.agentPool.map((agent) => (
              <div
                key={agent.agent}
                className="flex min-w-0 items-center gap-2.5 bg-panel p-2"
              >
                <AgentAvatar
                  portrait={agent.portrait}
                  name={agent.agent}
                  color={agent.color}
                  size={32}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-display text-[14px] font-semibold text-zinc-100">
                      {agent.agent}
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold text-victory num">
                      {agent.winRate}% WR
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-zinc-400 num">
                    {agent.games} {agent.games === 1 ? "match" : "matches"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </OverviewSection>
      )}

      {/* 5. Most Played Maps */}
      {careerUsable && career && career.mapStats.length > 0 && (
        <OverviewSection label="Most played maps" testId="drawer-maps">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-edge [&>*:last-child:nth-child(odd)]:col-span-2">
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

      {/* 6. Connections (Encounter History) */}
      {encounter && (encounter.withCount > 0 || encounter.againstCount > 0) && (
        <OverviewSection label="Connections" testId="drawer-encounter">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-edge bg-card p-2.5">
              <div className="text-[12px] font-semibold text-zinc-400">
                Together
              </div>
              <ConnectionLine
                total={encounter.withCount}
                wins={encounter.winsWith}
                losses={encounter.lossesWith}
                draws={encounter.drawsWith}
                pending={encounter.pendingWith}
              />
            </div>
            <div className="rounded-md border border-edge bg-card p-2.5">
              <div className="text-[12px] font-semibold text-zinc-400">
                Against
              </div>
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

      {/* 7. Loadout */}
      <div className="profile-dossier-loadout">
        <OverviewSection label="Loadout" testId="drawer-loadout">
          <div className="grid grid-cols-4 gap-1.5 overflow-hidden">
          {featuredWeapons.map(({ weapon, item }) => (
            <div
              key={weapon}
              className="flex min-w-0 flex-col items-center justify-between rounded-md border border-edge bg-card p-2 text-center"
            >
              <div className="flex h-7 w-full items-center justify-center">
                {item?.skin?.icon ? (
                  <img
                    src={item.skin.icon}
                    alt=""
                    className={`h-7 max-h-7 w-full object-contain ${
                      weapon === "Melee" ? "scale-110" : ""
                    }`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-[12px] text-zinc-600">—</span>
                )}
              </div>
              <div
                className="mt-1.5 w-full truncate text-[12px] font-semibold text-zinc-300"
                title={item?.skin?.name ?? undefined}
              >
                {item ? item.skin?.name ?? "Standard" : "Unavailable"}
              </div>
              <div className="text-[12px] font-semibold text-zinc-400">
                {weapon === "Melee" ? "Knife" : weapon}
              </div>
            </div>
          ))}
          </div>
        </OverviewSection>
      </div>
    </div>
  );
}
