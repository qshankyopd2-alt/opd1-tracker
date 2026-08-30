import type { Career, LivePlayer } from "../../../api/types";
import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { fmtNum, fmtPct } from "../../../lib/format";
import { FrequentTeammates } from "./FrequentTeammates";
import { MapStatCard } from "./MapStatCard";

const FEATURED_WEAPONS = ["Vandal", "Phantom", "Operator", "Melee"] as const;

function OverviewSection({ label, testId, children }: { label: string; testId?: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-[104px_minmax(0,1fr)] border-b border-edge/70 py-3 max-[560px]:grid-cols-1 max-[560px]:gap-2" data-testid={testId}>
      <h3 className="text-[11px] font-semibold text-zinc-400">{label}</h3>
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
        <div className="grid grid-cols-2 gap-4">
          <RankEntry label="Peak" name={player.peakRank || "Unknown"} icon={player.peakIcon} color={player.peakColor} detail={player.peakAct} />
          <RankEntry label="Previous" name={player.previousRank || "Unknown"} icon={previousRankIcon} color={previousRankColor} />
        </div>
      </OverviewSection>

      <OverviewSection label="Recent form" testId="drawer-performance-grid">
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-5 w-full" /></div>
        ) : !careerUsable || !career || error ? (
          <p className="text-[12px] text-zinc-500" data-testid="drawer-career-unavailable">Career details are unavailable for this player right now.</p>
        ) : (
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-[24px] font-black leading-none text-zinc-100 num">
                {wins}W–{losses}L{draws > 0 ? ` · ${draws}D` : ""}
              </span>
              <span className="font-mono text-[16px] font-semibold text-zinc-300 num">{fmtPct(career.averages.winRate)} win rate</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-400 num">
              <span className="text-zinc-200">{fmtNum(career.averages.kd, 2)} K/D</span>
              <span className="mx-2 text-zinc-700">·</span>{fmtPct(career.averages.hsPct)} headshots
              <span className="mx-2 text-zinc-700">·</span>{fmtNum(career.averages.kills, 1)} / {fmtNum(career.averages.deaths, 1)} / {fmtNum(career.averages.assists, 1)} avg K/D/A
            </p>
            <p className="mt-2 border-t border-edge/60 pt-2 text-[10px] text-zinc-500 num">
              This act <span className="mx-1.5 text-zinc-700">·</span><span className="text-zinc-300">{player.games}</span> matches <span className="mx-1.5 text-zinc-700">·</span><span className="text-zinc-300">{fmtPct(player.winRate)}</span> win rate
            </p>
          </div>
        )}
      </OverviewSection>

      <OverviewSection label="Loadout" testId="drawer-loadout">
        <div className="grid grid-cols-4 divide-x divide-edge/60 overflow-hidden border border-edge/70 bg-card/40">
          {featuredWeapons.map(({ weapon, item }) => (
            <div key={weapon} className="min-w-0 px-2 py-2">
              <div className="flex h-6 items-center justify-center">
                {item?.skin?.icon ? <img src={item.skin.icon} alt="" className="h-6 w-full object-contain opacity-75" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="text-[10px] text-zinc-600">—</span>}
              </div>
              <div className="mt-1 truncate text-[11px] font-medium text-zinc-200" title={item?.skin?.name ?? undefined}>{item ? item.skin?.name ?? "Standard" : "Unavailable"}</div>
              <div className="mt-0.5 truncate text-[10px] text-zinc-500">{weapon === "Melee" ? "Knife" : weapon}</div>
            </div>
          ))}
        </div>
      </OverviewSection>

      {careerUsable && career && career.agentPool.length > 0 && (
        <OverviewSection label="Most played agents" testId="drawer-agent-pool">
          <div className="grid grid-cols-2 overflow-hidden border border-edge/70">
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
          <div className="grid grid-cols-2 overflow-hidden border border-edge/70 bg-card/35">
            {career.mapStats.map((map) => <MapStatCard key={map.map} map={map.map} games={map.games} winRate={map.winRate} splash={mapSplashes.get(map.map) ?? null} />)}
          </div>
        </OverviewSection>
      )}

      {((encounter && (encounter.withCount > 0 || encounter.againstCount > 0)) || (careerUsable && career && career.coPlayers.length > 0)) && (
        <OverviewSection label="Connections" testId="drawer-encounter">
          {encounter && (encounter.withCount > 0 || encounter.againstCount > 0) && (
            <div className="grid grid-cols-2 divide-x divide-edge/70 border-y border-edge/70 py-2">
              <div className="pr-3">
                <div className="text-[10px] font-semibold text-zinc-500">Together</div>
                <div className="mt-1 text-[12px] font-semibold text-victory num">{encounter.withCount} matches · {encounter.winsWith}W–{encounter.lossesWith}L</div>
              </div>
              <div className="pl-3">
                <div className="text-[10px] font-semibold text-zinc-500">Against</div>
                <div className="mt-1 text-[12px] font-semibold text-defeat num">{encounter.againstCount} matches · {encounter.winsAgainst}W–{encounter.lossesAgainst}L</div>
              </div>
            </div>
          )}
          {careerUsable && career && <FrequentTeammates teammates={career.coPlayers} />}
        </OverviewSection>
      )}
    </div>
  );
}
