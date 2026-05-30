"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/api";
import { getTier } from "@/lib/supabase";
import { displayPostcode, normalisePostcode, readJson, writeJson } from "@/app/lib/helpers";
import { BI_KEY } from "@/app/lib/types";
import type { User } from "@supabase/supabase-js";

export function BusinessIntelligence({
  user,
  live,
  bestTime,
  onPricing,
}: {
  user: User;
  live: any;
  bestTime: string | null;
  onPricing: () => void;
}) {
  const [postcode, setPostcode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const email = user.email || "anon";
  const tier = getTier(user);
  const usedMap = readJson<Record<string, string>>(BI_KEY, {});
  const usedPostcode = usedMap[email];

  useEffect(() => {
    if (usedPostcode) runLookup(usedPostcode, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedPostcode]);

  async function runLookup(pc: string, shouldStore = true) {
    const clean = normalisePostcode(pc);
    if (!clean) return;

    if (tier === "free" && usedPostcode && usedPostcode !== clean) {
      setPostcode(usedPostcode);
      setResult({
        tone: "warn",
        title: "Your free Business Intelligence search is already active.",
        body: `You can keep viewing ${displayPostcode(usedPostcode)}. Upgrade to search a new postcode.`,
      });
      return;
    }

    setLoading(true);
    try {
      const d = await getAlerts(displayPostcode(clean));
      const liveData = live?.data || live || {};
      const pieces = [
        `Carbon intensity: ${liveData.carbon_intensity ?? d?.carbon_intensity ?? "—"} g/kWh`,
        `Current price: ${liveData.price_pkwh ? Number(liveData.price_pkwh).toFixed(1) : "—"}p/kWh`,
        `Renewable mix: ${liveData.renewable_percentage ? Number(liveData.renewable_percentage).toFixed(1) : "—"}%`,
        "Energy demand and prices are at normal levels right now.",
        bestTime
          ? `Best predicted low-cost window: ${bestTime}.`
          : "Best predicted low-cost window is not available yet.",
      ];
      setResult({
        tone: "good",
        title: "",
        body: pieces.map((x) => `✓ ${x}`).join("\n"),
      });
      if (tier === "free" && shouldStore) {
        writeJson(BI_KEY, {
          ...readJson<Record<string, string>>(BI_KEY, {}),
          [email]: clean,
        });
      }
      setPostcode(clean);
    } catch (e: any) {
      setResult({
        tone: "bad",
        title: "We could not load this postcode.",
        body: e.message || "Please check the postcode and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" id="business-intelligence">
      <div className="panel-title">📍 Business Intelligence</div>
      <div className="panel-sub">
        Free users get 1 postcode search per account · upgrade for unlimited
        searches
      </div>
      <div className="search-row">
        <input
          value={displayPostcode(postcode)}
          onChange={(e) => setPostcode(e.target.value)}
        />
        <button
          className="btn outline"
          onClick={() => runLookup(postcode, true)}
          disabled={loading}
        >
          {loading ? "…" : "Check"}
        </button>
      </div>
      {result && (
        <div className={`notice ${result.tone || "info"}`}>
          {result.title && <strong>{result.title}</strong>}
          <p>{result.body}</p>
          {result.tone === "warn" && (
            <button className="btn primary" onClick={onPricing}>
              👑 Upgrade now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
