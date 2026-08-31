import type { Career, LivePlayer } from "../../../api/types";
import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { fmtNum, fmtPct } from "../../../lib/format";
import { FrequentTeammates } from "./FrequentTeammates";
import { MapStatCard } from "./MapStatCard";

const FEATURED_WEAPONS = ["Vandal", "Phantom", "Operator", "Melee"] as const;

export function connectionSummary(total: number, wins: number, losses: number,
  draws = 0, explicitPending?: number): string {
  const resolved = wins + losses + draws;
  const pending = explicitPending ?? Math.max(0, total - resolved);
  const displayTotal = Math.max(total, resolved + pending);
  return `${displayTotal} matches · ${wins}W–${losses}L–${draws}D${pending ? ` · ${pending} result${pending === 1 ? "" : "s"} unavailable` : ""}`;
}

function OverviewSection({ label, testId, children }: { label: string; testId?: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-edge/70 py-3" data-testid={testId}>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</h3>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function RankEntry({ label, name, icon, color, detail }: { label: string; name: string; icon: string | null; color: string; detail?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {icon ? <img src={icon} alt="" className="h-8 w-8 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="h-8 w-8 shrink-0 border border-edge" />}
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-zinc-500">{label}</div>
        <div className="truncate text-[13px] font-semibold" style={{ color }}>{name || "Unknown"}</div>
        {detail && <div className="truncate text-[10px] text-zinc-500">{detail}</div>}
      </div>
    </div>
  );
}

function ConnectionLine({ total, wins, losses, draws = 0, pending: explicitPending }: {
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
    <div className="mt-1 flex flex-wrap items-baseline gap-x-1 text-[12px] font-semibold num">
      <span className="text-zinc-200">{displayTotal} matches</span>
      <span className="text-zinc-600">·</span>
      <span className="text-victory">{wins}W</span>
      <span className="text-zinc-500">–</span>
      <span className="text-defeat">{losses}L</span>
      <span className="text-zinc-500">–</span>
      <span className="text-zinc-300">{draws}D</span>
      {pending > 0 && <><span className="text-zinc-600">·</span><span className="font-medium text-zinc-500">{pending} result{pending === 1 ? "" : "s"} unavailable</span></>}
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
    <div data-testid="drawer-career">
      <OverviewSection label="Rank history" testId="drawer-rank-chips">
        <div className="grid grid-cols-2 gap-6 border-y border-edge/60 py-2.5">
          <RankEntry label="Peak" name={player.peakRank || "Unknown"} icon={player.peakIcon} color={player.peakColor} detail={player.peakAct} />
          <RankEntry label="Previous" name={player.previousRank || "Unknown"} icon={previousRankIcon} color={previousRankColor} />
        </div>
      </OverviewSection>

      {careerUsable && career && career.coPlayers.length > 0 && (
        <OverviewSection label="Frequent teammates" testId="drawer-frequent-connections">
          <FrequentTeammates teammates={career.coPlayers} embedded />
        </OverviewSection>
      )}

      <OverviewSection label="Performance" testId="drawer-performance-grid">
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-5 w-full" /></div>
        ) : !careerUsable || !career || error ? (
          <p className="text-[12px] text-zinc-500" data-testid="drawer-career-unavailable">Career details are unavailable for this player right now.</p>
        ) : (
          <div className="bg-card/20">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Last 8 matches</div>
            <div className="grid grid-cols-[1.25fr_repeat(3,1fr)] divide-x divide-edge/60 border-y border-edge/70">
              <div className="px-2 py-2"><span className="block font-display text-[20px] font-black leading-none text-zinc-100 num">{wins}W–{losses}L{draws > 0 ? ` · ${draws}D` : ""}</span><span className="mt-1 block text-[10px] uppercase tracking-wide text-zinc-500">Record</span></div>
              <div className="px-2 py-2"><span className="block font-mono text-[14px] font-semibold text-zinc-300 num">{fmtPct(career.averages.winRate)}</span><span className="mt-1 block text-[10px] uppercase tracking-wide text-zinc-500">Win rate</span></div>
              <div className="px-2 py-2"><span className="block font-mono text-[13px] font-medium text-zinc-400 num">{fmtNum(career.averages.kd, 2)}</span><span className="mt-1 block text-[10px] uppercase tracking-wide text-zinc-600">K/D</span></div>
              <div className="px-2 py-2"><span className="block font-mono text-[13px] font-medium text-zinc-400 num">{fmtPct(career.averages.hsPct)}</span><span className="mt-1 block text-[10px] uppercase tracking-wide text-zinc-600">Headshots</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-edge/70 px-2 py-2 text-[10px] text-zinc-500 num">
              <span className="font-semibold uppercase tracking-wide text-zinc-500">This act</span>
              <span><strong className="text-[12px] text-zinc-200">{player.games}</strong> matches</span>
              <span><strong className="text-[12px] text-zinc-200">{fmtPct(player.winRate)}</strong> win rate</span>
              <span><strong className="text-[12px] text-zinc-200">{fmtNum(career.averages.kills, 1)} / {fmtNum(career.averages.deaths, 1)} / {fmtNum(career.averages.assists, 1)}</strong> average K/D/A</span>
            </div>
          </div>
        )}
      </OverviewSection>

      {careerUsable && career && career.agentPool.length > 0 && (
        <OverviewSection label="Most played agents" testId="drawer-agent-pool">
          <div className="grid grid-cols-2 border-y border-edge/70">
            {career.agentPool.map((agent) => (
              <div key={agent.agent} className="flex min-w-0 items-center gap-2 border-b border-r border-edge/60 px-2 py-1.5 even:border-r-0">
                <AgentAvatar portrait={agent.portrait} name={agent.agent} color={agent.color} size={24} />
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-semibold text-zinc-200">{agent.agent}</div>
                  <div className="truncate text-[10px] text-zinc-500 num">{agent.games} matches · {agent.winRate}% win rate</div>
                </div>
              </div>
            ))}
          </div>
        </OverviewSection>
      )}

      {careerUsable && career && career.mapStats.length > 0 && (
        <OverviewSection label="Most played maps" testId="drawer-maps">
          <div className="grid grid-cols-2 overflow-hidden border-y border-edge/70 bg-card/20">
            {career.mapStats.map((map) => <MapStatCard key={map.map} map={map.map} games={map.games} winRate={map.winRate} splash={mapSplashes.get(map.map) ?? null} />)}
          </div>
        </OverviewSection>
      )}

      {encounter && (encounter.withCount > 0 || encounter.againstCount > 0) && (
        <OverviewSection label="Connections" testId="drawer-encounter">
          <div className="grid grid-cols-2 divide-x divide-edge/70 border-y border-edge/70 py-2.5">
            <div className="pr-3">
              <div className="text-[10px] font-semibold text-zinc-500">Together</div>
              <ConnectionLine total={encounter.withCount} wins={encounter.winsWith} losses={encounter.lossesWith} draws={encounter.drawsWith} pending={encounter.pendingWith} />
            </div>
            <div className="pl-3">
              <div className="text-[10px] font-semibold text-zinc-500">Against</div>
              <ConnectionLine total={encounter.againstCount} wins={encounter.winsAgainst} losses={encounter.lossesAgainst} draws={encounter.drawsAgainst} pending={encounter.pendingAgainst} />
            </div>
          </div>
        </OverviewSection>
      )}

      <OverviewSection label="Loadout" testId="drawer-loadout">
        <div className="grid grid-cols-4 divide-x divide-edge/60 overflow-hidden border-y border-edge/70 bg-card/20">
          {featuredWeapons.map(({ weapon, item }) => (
            <div key={weapon} className="min-w-0 px-2 py-1.5">
              <div className="flex h-5 items-center justify-center">
                {item?.skin?.icon ? <img src={item.skin.icon} alt="" className={`h-5 w-full object-contain opacity-75 ${weapon === "Melee" ? "scale-110" : ""}`} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="text-[10px] text-zinc-600">—</span>}
              </div>
              <div className="mt-1 truncate text-[10px] font-medium text-zinc-400" title={item?.skin?.name ?? undefined}>{item ? item.skin?.name ?? "Standard" : "Unavailable"}</div>
              <div className="truncate text-[10px] text-zinc-600">{weapon === "Melee" ? "Knife" : weapon}</div>
            </div>
          ))}
        </div>
      </OverviewSection>
    </div>
  );
}
