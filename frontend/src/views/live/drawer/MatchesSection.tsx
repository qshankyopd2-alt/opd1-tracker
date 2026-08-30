import type { Career } from "../../../api/types";
import { Skeleton } from "../../../components/ui/Skeleton";
import { RecentMatchCard } from "./RecentMatchCard";

export function MatchesSection({
  career,
  careerUsable,
  loading,
  error,
  onOpenMatch,
}: {
  career: Career | null;
  careerUsable: boolean;
  loading: boolean;
  error: string | null;
  onOpenMatch: (matchId: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-px" data-testid="drawer-matches-loading">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error || !careerUsable || !career) {
    return <p className="border border-edge px-3 py-3 text-[12px] text-zinc-500" data-testid="drawer-matches-unavailable">Match history is unavailable right now.</p>;
  }

  if (career.matches.length === 0) {
    return <p className="border border-edge px-3 py-3 text-[12px] text-zinc-500" data-testid="drawer-matches-empty">No recent matches available.</p>;
  }

  return (
    <section aria-label="Recent matches" className="flex min-h-full flex-1 flex-col" data-testid="drawer-match-list">
      <div className="grid shrink-0 grid-cols-[3px_28px_minmax(0,1fr)_auto_auto_auto_minmax(96px,116px)] gap-2 border-b border-edge bg-ink/90 px-3 py-1.5 text-[10px] font-semibold text-zinc-500" aria-hidden="true">
        <span className="col-span-3">Match</span>
        <span>K/D/A</span>
        <span>ACS</span>
        <span>RR</span>
        <span className="text-right">Ending rank</span>
      </div>
      <div
        className="grid flex-1 border-x border-b border-edge [&>*:last-child]:border-b-0"
        style={{ minHeight: career.matches.length * 66, gridTemplateRows: `repeat(${career.matches.length}, minmax(66px, 1fr))` }}
      >
        {[...career.matches].sort((a, b) => b.startMillis - a.startMillis).map((match) => (
          <RecentMatchCard key={match.matchId} match={match} onOpen={() => onOpenMatch(match.matchId)} />
        ))}
      </div>
    </section>
  );
}
