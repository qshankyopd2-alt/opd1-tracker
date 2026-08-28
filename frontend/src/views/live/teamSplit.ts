import type { LiveBoard, LivePlayer } from "../../api/types";

export interface TeamSplit {
  allyId: string | undefined;
  enemyId: string | undefined;
  ally: LivePlayer[];
  enemy: LivePlayer[];
}

/**
 * Split a live board into ally/enemy teams with the PREGAME safety boundary
 * applied: during agent select the enemy list is always empty, so the enemy
 * TeamPanel never renders — even if a fixture or unexpected backend payload
 * supplies enemy data.
 */
export function splitTeams(
  board: Pick<LiveBoard, "state" | "teams" | "selfTeam">,
): TeamSplit {
  const pregame = board.state === "PREGAME";
  const teamIds = Object.keys(board.teams ?? {});
  const allyId = teamIds.includes(board.selfTeam) ? board.selfTeam : teamIds[0];
  const enemyId = teamIds.find((t) => t !== allyId);
  const ally = allyId ? board.teams[allyId] : [];
  const enemy = pregame ? [] : enemyId ? board.teams[enemyId] : [];
  return { allyId, enemyId, ally, enemy };
}
