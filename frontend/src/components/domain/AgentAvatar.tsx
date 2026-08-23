import { useState } from "react";

export function AgentAvatar({
  portrait,
  name,
  color,
  size = 34,
  testId,
}: {
  portrait: string | null | undefined;
  name: string | null | undefined;
  color?: string;
  size?: number;
  testId?: string;
}) {
  const [failed, setFailed] = useState(false);
  const border = color ?? "#3f3f46";
  if (!portrait || failed) {
    return (
      <span
        data-testid={testId}
        style={{ width: size, height: size, borderColor: `${border}88`, color: border }}
        className="inline-flex items-center justify-center shrink-0 rounded-sm border bg-panel font-display font-bold text-sm uppercase"
        title={name ?? undefined}
      >
        {name ? name.charAt(0) : "?"}
      </span>
    );
  }
  return (
    <img
      data-testid={testId}
      src={portrait}
      alt={name ?? "agent"}
      title={name ?? undefined}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, borderColor: `${border}88` }}
      className="shrink-0 rounded-sm border object-cover bg-panel"
      loading="lazy"
      draggable={false}
    />
  );
}
