"use client";

import type { User } from "@supabase/supabase-js";
import { firstName } from "@/app/lib/helpers";

export function Topbar({
  user,
  onPricing,
  onSignOut,
}: {
  user: User;
  onPricing: () => void;
  onSignOut: () => void;
}) {
  const name = firstName(user);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((x: string) => x[0])
    .join("")
    .toUpperCase();
  return (
    <div className="topbar">
      <button className="pill">FREE PLAN</button>
      <button className="upgrade" onClick={onPricing}>
        👑 Upgrade
      </button>
      <div className="avatar">{initials || "U"}</div>
      <div className="who">
        <strong>{name}</strong>
        <span>{user.email}</span>
      </div>
      <button className="plain" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
