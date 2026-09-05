import { useState } from "react";
import type { WeaponLoadout } from "../../api/types";

const FEATURED_WEAPONS = ["Vandal", "Phantom", "Operator", "Melee"] as const;

function WeaponSlot({ weapon, item }: { weapon: string; item?: WeaponLoadout }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const icon = item?.skin?.icon;
  const label = weapon === "Melee" ? "Knife" : weapon;
  const skinName = item?.skin?.name ?? "Unavailable";
  const imageAvailable = Boolean(icon && icon !== failedUrl);
  return (
    <span className="weapon-slot" title={`${label}: ${skinName}`} data-testid={`weapon-slot-${weapon}`}>
      <span className="weapon-image">
        {imageAvailable ? (
          <img src={icon!} alt={`${label}: ${skinName}`} draggable={false} loading="lazy" onError={() => setFailedUrl(icon!)} />
        ) : <span className="weapon-unavailable">{item?.skin ? "Image unavailable" : "Unavailable"}</span>}
      </span>
      <span className="weapon-name">{label}</span>
      <span className="weapon-skin-name">{skinName}</span>
    </span>
  );
}

export function WeaponLoadoutStrip({ weapons, compact = false }: { weapons: WeaponLoadout[]; compact?: boolean }) {
  return (
    <div className={`weapon-loadout ${compact ? "weapon-loadout-compact" : ""}`} data-testid="weapon-loadout">
      {FEATURED_WEAPONS.map((weapon) => <WeaponSlot key={weapon} weapon={weapon} item={weapons.find((item) => item.weapon === weapon)} />)}
    </div>
  );
}
