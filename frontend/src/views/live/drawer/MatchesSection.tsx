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
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error || !careerUsable || !career) {
    return (
      <p className="border border-edge px-3 py-3 text-[12px] text-text-secondary" data-testid="drawer-matches-unavailable">
        Match history is unavailable right now.
      </p>
    );
  }

  if (career.matches.length === 0) {
    return (
      <p className="border border-edge px-3 py-3 text-[12px] text-text-secondary" data-testid="drawer-matches-empty">
        No recent matches available.
      </p>
    );
  }

  return (
    <section aria-label="Recent matches" data-testid="drawer-match-list">
      <div className="recent-match-row border-b border-edge bg-inset/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted" aria-hidden="true">
        <span className="col-span-2">
          Recent matches
          <span className="ml-2 normal-case tracking-normal text-text-muted/70">latest first</span>
        </span>
        <span>K / D / A</span>
        <span>ACS</span>
        <span>Rank & RR</span>
      </div>
      <div className="grid auto-rows-[88px]">
        {[...career.matches].sort((a, b) => b.startMillis - a.startMillis).map((match) => (
          <RecentMatchCard key={match.matchId} match={match} onOpen={(opener) => onOpenMatch(match.matchId, opener)} />
        ))}
      </div>
    </section>
  );
}
