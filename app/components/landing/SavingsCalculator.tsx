"use client";

import { useState } from "react";

export function SavingsCalculator({ onStart }: { onStart: () => void }) {
  const [daily, setDaily] = useState(0.49);
  const weekly = (daily * 7).toFixed(2);
  const monthly = (daily * 30.44).toFixed(2);
  const yearly = (daily * 365).toFixed(2);

  return (
    <div style={{ background: "#f0fdf9", border: "1px solid #b8efe5", borderRadius: 24, padding: "40px 36px", margin: "0 0 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "#0fb89a", textTransform: "uppercase" as const }}>Savings Calculator</span>
          <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, margin: "12px 0 8px" }}>What does saving £{daily.toFixed(2)}/day actually mean?</h3>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, margin: "0 0 24px" }}>
            Even small daily savings compound quickly. Drag the slider to see what different daily savings levels add up to over time.
          </p>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              <span>Daily saving</span>
              <strong style={{ color: "#0d1b2e", fontSize: 18 }}>£{daily.toFixed(2)}</strong>
            </div>
            <input
              type="range"
              min={0.10}
              max={2.60}
              step={0.01}
              value={daily}
              onChange={e => setDaily(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#0fb89a" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              <span>£0.10/day</span>
              <span>£2.60/day</span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            £0.49/day = boiler flow temp reduction + one off-peak appliance shift. £0.93/day = add bill overcharge recovery. £2.08/day = EV overnight charging vs daytime rate.
          </p>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          {[
            { label: "Per week", value: `£${weekly}`, sub: "7 days of smarter usage" },
            { label: "Per month", value: `£${monthly}`, sub: "30 days of GridSense insight" },
            { label: "Per year", value: `£${yearly}`, sub: "compounded over 365 days", highlight: true },
          ].map(({ label, value, sub, highlight }) => (
            <div key={label} style={{ background: highlight ? "linear-gradient(135deg, #0fb89a, #0d9488)" : "#fff", border: `1px solid ${highlight ? "transparent" : "#d8e3ee"}`, borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: highlight ? "rgba(255,255,255,0.75)" : "#64748b", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: highlight ? "rgba(255,255,255,0.6)" : "#94a3b8" }}>{sub}</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 950, letterSpacing: -1, color: highlight ? "#fff" : "#0d1b2e" }}>{value}</div>
            </div>
          ))}
          <button className="gs-btn gs-primary" onClick={onStart} style={{ width: "100%", marginTop: 4 }}>
            Start identifying my savings →
          </button>
        </div>
      </div>
    </div>
  );
}
