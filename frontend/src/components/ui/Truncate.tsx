import { clsx } from "clsx";

export function Truncate({
  text,
  maxWidth,
  className,
  tooltip = true,
}: {
  text: string;
  maxWidth?: number | string;
  className?: string;
  tooltip?: boolean;
}) {
  return (
    <span
      dir="auto"
      title={tooltip ? text : undefined}
      className={clsx("block min-w-0 truncate", className)}
      style={maxWidth != null ? { maxWidth } : undefined}
    >
      {text}
    </span>
  );
}
