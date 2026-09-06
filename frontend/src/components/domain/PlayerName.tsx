/** Keep the Riot tag visually separate without changing identity or copy text. */
export function PlayerName({ name }: { name: string }) {
  const separator = name.lastIndexOf("#");
  const hasTag = separator > 0 && separator < name.length - 1;
  return <span className="player-name" title={name} dir="auto">
    <bdi className="player-name-main">{hasTag ? name.slice(0, separator) : name}</bdi>
    {hasTag && <bdi className="player-name-tag">{name.slice(separator)}</bdi>}
  </span>;
}
