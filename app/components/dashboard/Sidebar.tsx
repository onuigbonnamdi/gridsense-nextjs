"use client";

import type { User } from "@supabase/supabase-js";
import { readJson } from "@/app/lib/helpers";
import { BI_KEY, HOME_KEY } from "@/app/lib/types";
import { FAQSection } from "@/app/components/landing/FAQSection";

export function Sidebar({ user, onPricing }: { user: User; onPricing: () => void }) {
  const items = [
    ["⌂", "Dashboard", "#dashboard"],
    ["▣", "Business Intelligence", "#business-intelligence"],
    ["⌂", "Home Energy Savings", "#home-energy-savings"],
    ["💼", "Savings Report", "#savings-report"],
    ["🔔", "Alerts", "#alerts"],
    ["⚙", "API & Export", "#api-export"],
  ];
  const email = user.email || "anon";
  const biUsed = readJson<Record<string, string>>(BI_KEY, {})[email] ? 1 : 0;
  const homeUsed = readJson<Record<string, any>>(HOME_KEY, {})[email] ? 1 : 0;
  return (
    <aside className="sidebar">
      <a className="brand" href="#dashboard">
        <div className="logo">ϟ</div>
        <div>
          <strong>GridSense</strong>
          <span>by evervia</span>
        </div>
      </a>
      <nav>
        {items.map(([i, t, h]) => (
          <a key={t} href={h}>
            {i} {t}
          </a>
        ))}
      </nav>
      <div className="limit-card">
        <strong>Free Plan Limits</strong>
        <p>
          Postcode searches <b>{biUsed} / 1 used</b>
        </p>
        <div className="bar">
          <span style={{ width: `${biUsed * 100}%` }} />
        </div>
        <p>
          Home analyses <b>{homeUsed} / 1 used</b>
        </p>
        <div className="bar">
          <span style={{ width: `${homeUsed * 100}%` }} />
        </div>
        <button className="btn primary wide-btn" onClick={onPricing}>
          👑 Upgrade now
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="faq-sidebar">
          <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 8, position: "sticky", top: 0, background: "#fbfdff", zIndex: 1, paddingBottom: 6 }}>❓ Common questions</div>
          <FAQSection compact />
        </div>
        <button
          className="support"
          onClick={() => window.dispatchEvent(new CustomEvent("open-support"))}
        >
          ⓘ Need help?<br />
          <strong>Contact support</strong>
        </button>
      </div>
    </aside>
  );
}
