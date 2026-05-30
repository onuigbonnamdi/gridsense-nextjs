"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Is there a free GridSense plan?",
    a: "Yes. GridSense has a free starter access level for basic account access and limited preview usage. Essential is the first paid household plan at £4.99/month and unlocks live UK grid data, the 48-hour forecast, postcode alerts and the cheapest window indicator. Premier and Elite add bill analysis, EPC ratings, property intelligence and portfolio tools.",
  },
  {
    q: "How accurate is the 48-hour forecast?",
    a: "GridSense uses a gradient boosting model trained on Elexon BMRS demand data and weather patterns. Current accuracy is 97% (R²=0.9701) on held-out test data. Forecasts are regenerated automatically as new grid data arrives.",
  },
  {
    q: "What does the Home Energy Rating tool do?",
    a: "It looks up your address against official government EPC records. You get your home's current energy rating, floor area, heating type and tenure. On Premier, you also get the full property profile and a personalised savings report.",
  },
  {
    q: "Can I upload any energy bill?",
    a: "Yes — PDF, JPEG or PNG bills from any UK supplier are supported. The AI reads your bill, compares usage and charges against the Ofgem price cap, and flags overcharges, wrong tariff classifications and missed savings. This is a Premier feature.",
  },
  {
    q: "What is the Business Intelligence panel?",
    a: "It gives you postcode-level energy signals — carbon intensity, current price, renewable mix and the best predicted low-cost window for that area. Free users get one postcode per account. Premier and above get unlimited searches.",
  },
  {
    q: "Does GridSense work for landlords?",
    a: "Yes. The Elite plan includes portfolio tracking for up to 5 properties, AI upgrade roadmaps ranked by saving potential, and legally required EPC compliance reports. For 10+ properties, Evervia B2B is the right product.",
  },
  {
    q: "How does the savings calculator work?",
    a: "Enter your estimated daily saving — from a simple boiler flow temperature adjustment (£0.49/day) up to EV overnight charging savings (£2.08/day). The calculator compounds this to weekly, monthly and yearly figures so you can see the real impact.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. GridSense uses Supabase for authentication with row-level security. Bill files are processed and not stored beyond analysis. Payment is handled entirely by Stripe — GridSense never sees your card details.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, any time. Cancel from your account billing portal and your plan stays active until the end of the current billing period. No cancellation fees, no questions asked.",
  },
  {
    q: "What is the difference between GridSense and Evervia?",
    a: "GridSense is for households, individual landlords and developers. Evervia is the B2B platform built for SMEs, facilities managers, NHS trusts and local councils — with multi-site dashboards, commercial EPC compliance and dedicated account management.",
  },
];

export function FAQSection({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = compact ? FAQ_ITEMS.slice(0, 5) : FAQ_ITEMS;
  return (
    <div className={compact ? "faq-compact" : "faq-full"}>
      {!compact && (
        <div className="gs-section-head">
          <span>FAQ</span>
          <h2>Common questions answered.</h2>
          <p>Everything you need to know before getting started.</p>
        </div>
      )}
      <div className="faq-list">
        {items.map((item, i) => (
          <div key={i} className={`faq-item ${open === i ? "open" : ""}`}>
            <button onClick={() => setOpen(open === i ? null : i)}>
              <span>{item.q}</span>
              <em>{open === i ? "−" : "+"}</em>
            </button>
            {open === i && <p>{item.a}</p>}
          </div>
        ))}
      </div>
      {compact && (
        <a href="#faq-preview" className="link-btn" style={{ fontSize: 13, marginTop: 12, display: "block" }}>
          View all FAQs →
        </a>
      )}
    </div>
  );
}
