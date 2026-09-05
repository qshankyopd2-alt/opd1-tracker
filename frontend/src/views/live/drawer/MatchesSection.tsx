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
  onOpenMatch: (matchId: string, opener: HTMLElement) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-px" data-testid="drawer-matches-loading">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error || !careerUsable || !career) {
    return <p className="border border-edge px-3 py-3 text-[12px] text-zinc-400" data-testid="drawer-matches-unavailable">Match history is unavailable right now.</p>;
  }

  if (career.matches.length === 0) {
    return <p className="border border-edge px-3 py-3 text-[12px] text-zinc-400" data-testid="drawer-matches-empty">No recent matches available.</p>;
  }

  return (
    <section aria-label="Recent matches" data-testid="drawer-match-list">
      <div className="flex shrink-0 items-center justify-between border-y border-edge bg-panel px-3 py-2 text-[12px] font-semibold text-zinc-400" aria-hidden="true">
        <span>Recent matches</span>
        <span className="text-zinc-400">K/D/A · ACS · RR · Ending rank</span>
      </div>
      <div className="grid auto-rows-[68px] border-x border-b border-edge [&>*:last-child]:border-b-0">
        {[...career.matches].sort((a, b) => b.startMillis - a.startMillis).map((match) => (
          <RecentMatchCard key={match.matchId} match={match} onOpen={(opener) => onOpenMatch(match.matchId, opener)} />
        ))}
      </div>
    </section>
  );
}
