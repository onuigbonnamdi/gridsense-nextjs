"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { createCheckout } from "@/lib/api";

export function UpgradeButton({ label = "👑 Upgrade now", plan = "premier" }: { label?: string; plan?: string }) {
  const [loading, setLoading] = useState(false);
  async function go() {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const r = await (createCheckout as any)(
        plan,
        data.session?.user?.email || "",
      );
      window.location.href = r.url;
    } finally {
      setLoading(false);
    }
  }
  return (
    <button className="btn primary" onClick={go} disabled={loading}>
      {loading ? "…" : label}
    </button>
  );
}
