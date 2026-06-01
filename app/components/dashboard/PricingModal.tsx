"use client";

import { useState } from "react";
import { UpgradeButton } from "@/app/components/dashboard/UpgradeButton";

export function PricingModal({ onClose }: { onClose: () => void }) {
  const [yearly, setYearly] = useState(false);
  const plans = [
    {
      key: "essential",
      name: "Essential",
      price: "£2.99",
      desc: "Everything you need to start saving on energy — right away.",
      period: "Monthly · cancel any time",
      coverage: "Up to 1 property",
      features: [
        "Live UK grid demand feed",
        "2-day AI demand forecast (97% accurate)",
        "Postcode grid alerts",
        "30-second auto-refresh",
        "Cheapest window indicator",
        "Renewable mix & frequency live",
      ],
    },
    {
      key: "premier",
      name: "Premier",
      price: "£5.99",
      desc: "Upload your bill, find overcharges, and get your home energy rating. Pays for itself.",
      period: "Monthly · cancel any time",
      popular: true,
      coverage: "Up to 3 properties",
      inherit: "Everything in Essential, plus:",
      features: [
        "Your home's official energy rating by postcode",
        "Bill upload & AI analysis",
        "Personalised savings report",
        "Compared against the government's official price cap",
        "Works across every UK region",
        "Bill overcharge detection",
      ],
    },
    {
      key: "elite",
      name: "Elite",
      price: "£14.99",
      desc: "For landlords and homeowners who want to go further.",
      period: "Monthly · cancel any time",
      coverage: "Up to 5 properties",
      inherit: "Everything in Premier, plus:",
      features: [
        "AI property upgrade roadmap",
        "Cost and savings estimate for each home improvement",
        "Portfolio tracking up to 5 properties",
        "Continuous efficiency monitoring",
        "Export & API access",
        "Priority support",
      ],
    },
  ];
  return (
    <div className="modal-backdrop">
      <div className="modal pricing-modal">
        <button className="x" onClick={onClose}>×</button>
        <div className="eyebrow">Pricing</div>
        <h2>Start free. Upgrade when it pays.</h2>
        <p className="modal-sub">Every plan saves you more than it costs. Cancel any time.</p>
        <div className="billing-toggle">
          <button className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>Monthly</button>
          <button className={yearly ? "active" : ""} onClick={() => setYearly(true)}>
            Yearly <em>2 months free</em>
          </button>
        </div>
        <div className="plans three-plans">
          {plans.map((pl) => (
            <div className={`plan ${pl.popular ? "pop" : ""}`} key={pl.name}>
              {pl.popular && <div className="pop-badge">Most popular</div>}
              <h3>{pl.name}</h3>
              <p className="plan-desc">{pl.desc}</p>
              <div className="price">
                {yearly
                  ? <>£{({ essential: "29.90", premier: "59.90", elite: "149.90" } as any)[pl.key]}<span>/yr</span></>
                  : <>{pl.price}<span>/mo</span></>
                }
              </div>
              {yearly && (
                <div className="yearly-save">
                  Save £{({ essential: "5.98", premier: "11.98", elite: "29.98" } as any)[pl.key]} vs monthly
                </div>
              )}
              <p className="plan-period">{pl.period}</p>
              {pl.coverage && <div className="plan-coverage">{pl.coverage}</div>}
              {pl.inherit && <div className="plan-inherit">{pl.inherit}</div>}
              <ul className="plan-features">
                {pl.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <UpgradeButton label={`Get ${pl.name}`} plan={pl.key} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: "16px 20px", background: "#f8fafc", borderRadius: 14, border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <strong style={{ fontSize: 14 }}>Managing 6+ properties or a business?</strong>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Evervia B2B covers multi-site dashboards, commercial EPC compliance, council & NHS pricing and dedicated account management.</p>
          </div>
          <a href="https://evervia.co.uk/" target="_blank" rel="noreferrer" className="btn outline" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>Visit Evervia →</a>
        </div>
      </div>
    </div>
  );
}