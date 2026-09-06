export function PlayerIdentity({ name }: { name: string }) {
  const separator = name.lastIndexOf("#");
  const hasTag = separator > 0 && separator < name.length - 1;
  return (
    <span title={name} dir="ltr" className="flex min-w-0 max-w-full items-baseline">
      <bdi className="min-w-0 truncate">{hasTag ? name.slice(0, separator) : name}</bdi>
      {hasTag && <span className="shrink-0 font-mono text-[0.8em] font-medium text-zinc-400">{name.slice(separator)}</span>}
    </span>
  );
}
