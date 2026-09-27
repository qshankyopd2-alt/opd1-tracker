import { useEffect, useState } from "react";

export function AgentAvatar({
  portrait,
  name,
  color,
  size = 34,
  testId,
  rounded = true,
}: {
  portrait: string | null | undefined;
  name: string | null | undefined;
  color?: string;
  size?: number;
  testId?: string;
  rounded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [portrait]);
  const border = color ?? "#3a4453";
  if (!portrait || failed) {
    return (
      <span
        data-testid={testId}
        style={{ width: size, height: size, borderColor: `${border}66`, color: border }}
        className={`inline-flex shrink-0 items-center justify-center border bg-panel font-display font-bold text-sm uppercase ${rounded ? "rounded-sm" : ""}`}
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
      style={{ width: size, height: size, borderColor: `${border}66` }}
      className={`shrink-0 border object-cover bg-panel ${rounded ? "rounded-sm" : ""}`}
      loading="lazy"
      draggable={false}
    />
  );
}
