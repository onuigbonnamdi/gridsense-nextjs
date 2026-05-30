"use client";

import { useEffect, useState } from "react";
import { getLive, getForecastPreview } from "@/lib/api";
import { forecastPoints, pointDemand, formatBestTimeFromForecast } from "@/app/lib/helpers";
import { FAQSection } from "@/app/components/landing/FAQSection";
import { SavingsCalculator } from "@/app/components/landing/SavingsCalculator";
import { Footer } from "@/app/components/landing/Footer";

export function LandingPage({ onStart }: { onStart: () => void }) {
  const [support, setSupport] = useState(false);
  const [live, setLive] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [pricingYearly, setPricingYearly] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [liveData, forecastData] = await Promise.allSettled([
          getLive(),
          getForecastPreview(),
        ]);
        if (!mounted) return;
        if (liveData.status === "fulfilled") setLive(liveData.value);
        if (forecastData.status === "fulfilled") setForecast(forecastData.value);
      } catch {}
    }
    load();
    const id = window.setInterval(load, 30000);
    const open = () => setSupport(true);
    window.addEventListener("open-support", open as EventListener);
    return () => {
      mounted = false;
      window.clearInterval(id);
      window.removeEventListener("open-support", open as EventListener);
    };
  }, []);

  const pts = forecastPoints(forecast).slice(0, 12);
  const values = pts.map(pointDemand).filter((v) => Number.isFinite(v) && v > 0);
  const max = Math.max(...values, 1);
  const bars = values.length ? values.map((v) => Math.max(18, Math.round((v / max) * 100))) : [38, 52, 46, 70, 58, 44, 35, 62, 78, 56, 42, 50];
  const bestWindow = formatBestTimeFromForecast(forecast) || live?.best_window || live?.cheapest_window || "Live once forecast data loads";
  const demand = live?.demand_gw;
  const carbon = live?.carbon_intensity;
  const price = live?.price_pkwh;
  const updated = live?.timestamp || live?.date;

  return (
    <div className="gs-landing">
      <header className="gs-header">
        <div className="gs-wrap gs-nav">
          <a className="gs-brand" href="#top">
            <span className="gs-mark">ϟ</span>
            <span>GridSense</span>
            <em>by evervia</em>
          </a>
          <nav className="gs-links">
            <a href="#features">Features</a>
            <a href="#dashboard-preview">Dashboard</a>
            <a href="#pricing-preview">Pricing</a>
            <a href="#faq-preview">FAQ</a>
          </nav>
          <div className="gs-actions">
            <button className="gs-link" onClick={onStart}>Sign in</button>
            <button className="gs-btn gs-primary" onClick={onStart}>Start Free</button>
          </div>
        </div>
      </header>

      <section id="top" className="gs-hero">
        <div className="gs-wrap gs-hero-grid">
          <div className="gs-copy">
            <div className="gs-pill"><span className="gs-dot" /> Live UK energy intelligence</div>
            <h1>Smarter energy.<br />Lower bills.<br /><span>Better timing.</span></h1>
            <p>
              GridSense helps households understand live UK grid demand, energy prices,
              carbon intensity, EPC performance and bill savings — all from one simple dashboard.
            </p>
            <div className="gs-hero-actions">
              <button className="gs-btn gs-primary" onClick={onStart}>Start Free →</button>
              <a className="gs-btn gs-secondary" href="#dashboard-preview">View dashboard</a>
            </div>
            <div className="gs-trust">
              <span>🇬🇧 UK grid data</span>
              <span>⚡ 48-hour forecast</span>
              <span>🏠 EPC insights</span>
              <span>🔒 Secure account</span>
            </div>
          </div>

          <div className="gs-preview" id="dashboard-preview">
            <div className="gs-preview-top">
              <strong>GridSense Dashboard</strong>
              <span>{live ? "LIVE" : "CONNECTING"}</span>
            </div>
            <div className="gs-kpi-row">
              <div><small>Grid demand</small><strong>{demand ? `${Number(demand).toFixed(1)} GW` : "— GW"}</strong><em>{updated ? `Live · ${new Date(updated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Live feed"}</em></div>
              <div><small>Carbon intensity</small><strong>{carbon ? `${Math.round(Number(carbon))} g/kWh` : "— g/kWh"}</strong><em>{live?.carbon_index || live?.carbon_status || "Low-carbon signal"}</em></div>
              <div><small>Price now</small><strong>{price ? `${Number(price).toFixed(1)}p/kWh` : "—p/kWh"}</strong><em>{live?.price_status || "Current signal"}</em></div>
            </div>
            <div className="gs-chart-card">
              <div className="gs-chart-head">
                <div><strong>48-Hour Demand Forecast</strong><small>AI-powered forecast · next demand windows</small></div>
                <a onClick={onStart}>Open dashboard →</a>
              </div>
              <div className="gs-bars">
                {bars.map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
              </div>
            </div>
            <div className="gs-insight-row">
              <div><b>Best usage window</b><span>{bestWindow}</span></div>
              <div><b>Potential saving</b><span>£340–£950/year depending on plan</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="gs-section gs-wrap">
        <div className="gs-section-head">
          <span>FEATURES</span>
          <h2>Everything a household needs to understand energy clearly.</h2>
          <p>No complex energy jargon. Just live data, practical insights and clear next steps.</p>
        </div>
        <div className="gs-feature-grid">
          <div><span>⚡</span><h3>Live grid intelligence</h3><p>Track demand, frequency, renewable mix, carbon intensity and price signals.</p></div>
          <div><span>📈</span><h3>48-hour forecast</h3><p>See when demand is likely to be lower and when appliances should be used.</p></div>
          <div><span>🏠</span><h3>Home EPC insights</h3><p>Search your address, view EPC details and unlock property-specific savings.</p></div>
          <div><span>📄</span><h3>Bill analysis</h3><p>Upload a bill to generate a personalised AI savings report on Premier.</p></div>
          <div><span>🔔</span><h3>Smart alerts</h3><p>Get useful alerts when prices, demand or usage windows change.</p></div>
          <div><span>🏢</span><h3>Business intelligence</h3><p>Check postcode-level energy and carbon signals for SMEs and sites.</p></div>
        </div>
      </section>

      <section className="gs-savings" id="savings">
        <div className="gs-wrap gs-savings-grid">
          <div>
            <span className="gs-mini">WHY IT MATTERS</span>
            <h2>Most households are overpaying. GridSense shows you exactly where.</h2>
            <div className="gs-saving-big">£340+</div>
            <p>The average household can keep over £340 more per year — without upgrading a single appliance. By shifting to off-peak windows, catching billing errors, and lowering your boiler flow temperature, GridSense gives you the data to act on what most people never even know to check.</p>
            <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 16 }}>
              EV or heat pump household? GridSense users with managed EV charging and heat pump optimisation have identified up to £760/year in savings potential. Solar + battery users tracking dynamic export tariffs: up to £950/year.
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              Sources: Energy Systems Catapult 2024 · Ofgem Price Cap 2025 · Energy Ombudsman / The Guardian 2025 · Fair By Design 2025
            </p>
            <button className="gs-btn gs-primary" style={{ marginTop: 24 }} onClick={onStart}>See where your money goes →</button>
          </div>
          <div className="gs-savings-cards">
            <div>
              <b>Essential — Off-peak shifting & boiler optimisation</b>
              <p>Shift washing machines and dishwashers to cheapest grid windows. Turn combi boiler flow temperature to 60°C. Eliminate standby drain. No new hardware needed.</p>
              <strong>£340+/year identified</strong>
            </div>
            <div>
              <b>Premier — Bill analysis & EV/heat pump insight</b>
              <p>AI bill analysis vs Ofgem price cap catches overcharges. EPC rating reveals your home&apos;s efficiency gap. EV time-of-use tariff guidance for overnight charging.</p>
              <strong>Up to £760/year identified</strong>
            </div>
            <div>
              <b>Elite — Solar, battery & property roadmap</b>
              <p>Understand your solar self-consumption, battery storage potential, and dynamic export tariff windows. Full property improvement roadmap ranked by £ saving.</p>
              <strong>Up to £950/year identified</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="gs-wrap" style={{ paddingBottom: 60 }}>
        <SavingsCalculator onStart={onStart} />
      </div>

      <section id="pricing-preview" className="gs-section gs-wrap">
        <div className="gs-section-head">
          <span>PRICING</span>
          <h2>Start free. Upgrade when it pays.</h2>
          <p>Every plan saves you more than it costs. Cancel any time.</p>
        </div>
        <div className="billing-toggle" style={{ margin: "0 auto 28px", width: "fit-content" }}>
          <button className={!pricingYearly ? "active" : ""} onClick={() => setPricingYearly(false)}>Monthly</button>
          <button className={pricingYearly ? "active" : ""} onClick={() => setPricingYearly(true)}>
            Yearly <em>2 months free</em>
          </button>
        </div>
        <div className="gs-price-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div>
            <h3>Essential</h3>
            <strong>{pricingYearly ? "£49.90/yr" : "£4.99/mo"}</strong>
            {pricingYearly && <div className="yearly-save">Save £9.98</div>}
            <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>Everything you need to start saving on energy — right away.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "grid", gap: 10 }}>
              {[
                "Live UK grid demand feed",
                "2-day AI demand forecast (97% accurate)",
                "Postcode grid alerts",
                "30-second auto-refresh",
                "Cheapest energy window indicator",
                "Renewable mix & frequency live",
                "Carbon intensity signal",
              ].map(f => (
                <li key={f} style={{ fontSize: 13, color: "#334155" }}><span style={{ color: "#00a889", fontWeight: 900, marginRight: 8 }}>✓</span>{f}</li>
              ))}
            </ul>
            <button className="gs-btn gs-primary" onClick={onStart} style={{ width: "100%" }}>Get Essential</button>
          </div>

          <div className="featured">
            <em>Most popular</em>
            <h3>Premier</h3>
            <strong>{pricingYearly ? "£99.90/yr" : "£9.99/mo"}</strong>
            {pricingYearly && <div className="yearly-save">Save £19.98</div>}
            <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>Upload your bill, find overcharges, and get your home energy rating. Pays for itself.</p>
            <div style={{ background: "#ecfdf7", border: "1px solid rgba(20,184,166,.28)", borderRadius: 10, padding: "10px 12px", fontSize: 12, fontWeight: 900, color: "#009b84", margin: "0 0 14px" }}>Everything in Essential, plus:</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "grid", gap: 10 }}>
              {[
                "Your home's official EPC rating by postcode",
                "Bill upload & AI analysis",
                "Personalised savings report",
                "Compared against the government price cap",
                "Works across every UK region",
                "Bill overcharge detection",
              ].map(f => (
                <li key={f} style={{ fontSize: 13, color: "#334155" }}><span style={{ color: "#00a889", fontWeight: 900, marginRight: 8 }}>✓</span>{f}</li>
              ))}
            </ul>
            <button className="gs-btn gs-primary" onClick={onStart} style={{ width: "100%" }}>Get Premier →</button>
          </div>

          <div>
            <h3>Elite</h3>
            <strong>{pricingYearly ? "£199.90/yr" : "£19.99/mo"}</strong>
            {pricingYearly && <div className="yearly-save">Save £39.98</div>}
            <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>For landlords and homeowners who want to go further.</p>
            <div style={{ background: "#ecfdf7", border: "1px solid rgba(20,184,166,.28)", borderRadius: 10, padding: "10px 12px", fontSize: 12, fontWeight: 900, color: "#009b84", margin: "0 0 14px" }}>Everything in Premier, plus:</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "grid", gap: 10 }}>
              {[
                "AI property upgrade roadmap",
                "Cost & savings estimate per improvement",
                "Portfolio tracking up to 5 properties",
                "Continuous efficiency monitoring",
                "REST API access & data export",
                "Priority support",
              ].map(f => (
                <li key={f} style={{ fontSize: 13, color: "#334155" }}><span style={{ color: "#00a889", fontWeight: 900, marginRight: 8 }}>✓</span>{f}</li>
              ))}
            </ul>
            <button className="gs-btn gs-primary" onClick={onStart} style={{ width: "100%" }}>Get Elite</button>
          </div>
        </div>

        <div style={{ marginTop: 40, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 24, padding: "32px 36px", display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "#0fb89a", textTransform: "uppercase", marginBottom: 10 }}>GridSense Labs</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 12px" }}>GridSense — for home users and developers.</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.75, margin: "0 0 8px" }}>
              GridSense is Evervia&apos;s consumer and developer product. It gives individuals and technical users direct access to the same live UK grid intelligence that powers Evervia&apos;s B2B platform — as a personal energy tool and REST API.
            </p>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.75, margin: "0 0 8px" }}>
              If you are an SME, facilities manager, or public sector organisation, Evervia is built for you. GridSense is for everyone else.
            </p>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.75, margin: 0 }}>
              For organisations: commercial EPC compliance, multi-site dashboards, API access at scale, and dedicated account management — council and NHS pricing available.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 220 }}>
            <a href="https://evervia.co.uk/" target="_blank" rel="noreferrer"
              style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg, #1fd4b0, #0fb89a)", color: "#031a16", borderRadius: 12, padding: "13px 18px", fontWeight: 900, fontSize: 14 }}>
              Visit Evervia for Business →
            </a>
          </div>
        </div>
      </section>

      <section className="gs-section gs-wrap" id="faq-preview">
        <FAQSection />
      </section>

      <section className="gs-footer-cta">
        <div className="gs-wrap">
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "#0fb89a", textTransform: "uppercase", marginBottom: 16 }}>Get started today</div>
          <h2>Your energy bill is paying<br />someone else. Not anymore.</h2>
          <p>UK households collectively owe £4.43bn in energy debt. Billing errors, wrong tariffs, and missed off-peak windows cost billions every year. GridSense gives you the data to act — live grid intelligence, bill analysis, and home energy ratings in one place.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="gs-btn gs-primary" onClick={onStart}>Start Free — Essential Plan</button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-support"))}
              style={{ display: "inline-flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 14, padding: "13px 20px", fontWeight: 900, color: "#fff", background: "transparent", cursor: "pointer" }}>
              Talk to us →
            </button>
          </div>
        </div>
      </section>
      <Footer />
      {support && (
        <div className="modal-backdrop">
          <div className="support-modal">
            <button className="x" onClick={() => setSupport(false)}>×</button>
            <h2>Talk to us</h2>
            <p>Tell us what you need help with and we&apos;ll get back to you.</p>
            <input placeholder="Your name" />
            <input placeholder="Email address" />
            <input placeholder="Phone number (optional)" />
            <input placeholder="Subject" />
            <textarea placeholder="How can we help?" />
            <button className="btn primary">Send message</button>
          </div>
        </div>
      )}
    </div>
  );
}
