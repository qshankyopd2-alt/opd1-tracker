import { Radio, Users } from "lucide-react";
import type { QueueState } from "../../api/types";
import { Section } from "../../components/ui/Section";

function Field({ label, value, tone }: { label: string; value: string; tone?: "ok" | "muted" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-edge/60 py-1.5 last:border-b-0">
      <span className="micro-label">{label}</span>
      <span
        className={`font-display text-[12.5px] font-semibold ${
          tone === "ok" ? "text-victory" : tone === "muted" ? "text-text-muted" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function LobbyQueueCard({ queue }: { queue?: QueueState }) {
  return (
    <Section title="Queue" testId="lobby-queue-card" pad={false}>
      <div className="px-3.5 py-2">
        {!queue?.available ? (
          <p className="py-4 text-[12px] leading-relaxed text-text-secondary" data-testid="lobby-queue-unavailable">
            No queue information is available right now. The lobby party is still shown — queue details appear when the
            client reports them.
          </p>
        ) : (
          <>
            <Field label="Queue" value={queue.queueName ?? "Not selected"} />
            <Field label="Party size" value={`×${queue.partySize ?? 1}`} />
            <Field label="Status" value={queue.inQueue ? "In queue" : "Not queued"} tone={queue.inQueue ? "ok" : "muted"} />
            {queue.allReady !== undefined && (
              <Field label="Ready check" value={queue.allReady ? "All ready" : "Waiting"} tone={queue.allReady ? "ok" : "muted"} />
            )}
            {queue.message && <Field label="Note" value={queue.message} tone="muted" />}
          </>
        )}
        <div className="flex items-center gap-2 px-0 py-2.5 text-[11px] text-text-muted">
          {queue?.available ? <Users size={12} /> : <Radio size={12} />}
          Queue controls are intentionally not exposed.
        </div>
      </div>
    </Section>
  );
}
