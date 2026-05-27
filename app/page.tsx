"use client";

import { useEffect, useState } from "react";
import { supabase, getTier } from "@/lib/supabase";
import { getLive, getForecast, getForecastPreview, getAlerts, getAddress, createCheckout, getToken, API } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

const BI_KEY = "gridsense_free_bi_postcodes";
const HOME_KEY = "gridsense_free_home_claims_local";

type Notice = {
  title: string;
  body?: string;
  tone?: "info" | "warn" | "good" | "bad";
};
type AddressItem = { label: string; raw?: any };
type ClaimedHome = {
  key: string;
  address: string;
  postcode: string;
  claimedBy: string;
  claimedAt: string;
};

function normalisePostcode(v: string) {
  return (v || "").toUpperCase().replace(/\s+/g, "");
}

function displayPostcode(v: string) {
  const pc = normalisePostcode(v);
  return pc.length > 3 ? `${pc.slice(0, -3)} ${pc.slice(-3)}` : pc;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function firstName(user: User | null) {
  const full =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    "";
  if (full && !full.includes("@")) return full.trim();
  const emailName = user?.email?.split("@")[0] || "User";
  return emailName
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function forecastPoints(payload: any): any[] {
  const candidates = [
    payload?.forecast_48hr?.points,
    payload?.forecast_48hr,
    payload?.forecast48,
    payload?.forecast,
    payload?.next_48_hours,
    payload?.next_6_hours,
    payload?.points,
    payload?.results,
    payload?.rows,
    payload?.items,
    payload?.data?.forecast_48hr?.points,
    payload?.data?.forecast_48hr,
    payload?.data?.forecast,
    payload?.data?.next_48_hours,
    payload?.data?.next_6_hours,
    payload?.data?.points,
    payload?.data?.results,
    payload?.data?.rows,
    payload?.data?.items,
  ];
  return (candidates.find(Array.isArray) || []).filter(Boolean);
}

function pointTime(p: any) {
  return (
    p.datetime ||
    p.timestamp ||
    p.time ||
    p.start_time ||
    p.period_start ||
    p.settlement_date_time ||
    p.date_time ||
    p.from
  );
}

function pointDemand(p: any) {
  return Number(
    p.forecast_mw ??
      p.demand_mw ??
      p.demand ??
      p.value ??
      p.forecast ??
      p.national_demand_mw ??
      p.grid_demand_mw ??
      0,
  );
}

function pointPrice(p: any) {
  const v =
    p.price_pkwh ?? p.price_p_kwh ?? p.price ?? p.p_per_kwh ?? p.unit_rate;
  return v == null ? null : Number(v);
}

function formatBestTimeFromForecast(payload: any) {
  const explicit =
    payload?.cheapest_window ||
    payload?.best_window ||
    payload?.best_time ||
    payload?.lowest_price_window ||
    payload?.data?.cheapest_window ||
    payload?.data?.best_window ||
    payload?.data?.best_time ||
    payload?.data?.lowest_price_window;

  if (explicit) {
    if (typeof explicit === "string") return explicit;
    const start =
      explicit.start ||
      explicit.from ||
      explicit.start_time ||
      explicit.time ||
      explicit.datetime;
    const end = explicit.end || explicit.to || explicit.end_time;
    const price =
      explicit.price_pkwh ||
      explicit.price_p_kwh ||
      explicit.price ||
      explicit.p_per_kwh;
    const startTxt = start
      ? new Date(start).toLocaleString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const endTxt = end
      ? new Date(end).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    return `${startTxt}${endTxt ? `–${endTxt}` : ""}${price ? ` at ${Number(price).toFixed(1)}p/kWh` : ""}`;
  }

  const pts = forecastPoints(payload);
  const priced = pts
    .map((p) => ({
      p,
      price: pointPrice(p),
      demand: pointDemand(p),
      time: pointTime(p),
    }))
    .filter((x) => x.time && (x.price != null || x.demand > 0));

  if (!priced.length) return null;

  priced.sort((a, b) => {
    const av = a.price != null ? a.price : a.demand;
    const bv = b.price != null ? b.price : b.demand;
    return av - bv;
  });

  const best = priced[0];
  const when = new Date(best.time).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return best.price != null
    ? `${when} at ${best.price.toFixed(1)}p/kWh`
    : `${when} when demand is forecast to be lowest`;
}

function addressLabel(x: any) {
  if (!x) return "";
  if (typeof x === "string") return x;
  return [
    x.address,
    x.full_address,
    x.address_line_1,
    x.address1,
    x.line_1,
    x.building_name,
    x.building_number,
    x.flat_number,
    x.flat,
    x.street,
    x.thoroughfare,
    x.posttown,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAddresses(payload: any): AddressItem[] {
  const candidates = [
    payload?.addresses,
    payload?.results,
    payload?.records,
    payload?.rows,
    payload?.items,
    payload?.data?.addresses,
    payload?.data?.results,
    payload?.data?.records,
    payload?.data?.rows,
    payload?.data?.items,
    payload?.data,
  ];

  const arr = candidates.find(Array.isArray) || [];
  const seen = new Set<string>();
  return arr
    .map((x: any) => ({ label: addressLabel(x), raw: x }))
    .filter((x: AddressItem) => {
      if (!x.label || seen.has(x.label.toLowerCase())) return false;
      seen.add(x.label.toLowerCase());
      return true;
    });
}

function propertyRows(data: any) {
  const p = data?.property || data?.data?.property || data?.data || data || {};
  const rows = [
    ["Address", p.address || p.full_address || p.address_line_1],
    [
      "Current EPC",
      p.epc_rating || p.current_energy_rating || p.current_rating,
    ],
    ["Potential EPC", p.potential_rating || p.potential_energy_rating],
    ["Property type", p.property_type || p.built_form],
    ["Floor area", p.total_floor_area ? `${p.total_floor_area} m²` : null],
    ["Heating", p.mainheat_description || p.main_heating],
    ["Tenure", p.tenure],
    ["Inspection date", p.inspection_date || p.lodgement_date],
  ].filter(([, v]) => v !== undefined && v !== null && v !== "");
  return rows as [string, any][];
}

function ForecastChart({
  large = false,
  onBestTime,
}: {
  large?: boolean;
  onBestTime?: (v: string | null) => void;
}) {
  const [chartData, setChartData] = useState<any>(null);
  const [status, setStatus] = useState("Loading forecast…");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getForecast();
        const best = formatBestTimeFromForecast(data);
        if (mounted) onBestTime?.(best);

        const pts = forecastPoints(data);
        if (!mounted) return;
        if (!pts.length) {
          setStatus(
            "Forecast failed to load. Please check the backend endpoint.",
          );
          return;
        }

        const shown = large ? pts.slice(0, 48) : pts.slice(0, 12);
        setChartData({
          labels: shown.map((p: any) => {
            const t = pointTime(p);
            return t
              ? new Date(t).toLocaleString(
                  "en-GB",
                  large
                    ? { weekday: "short", hour: "2-digit" }
                    : { hour: "2-digit", minute: "2-digit" },
                )
              : "";
          }),
          datasets: [
            {
              label: "Forecast demand",
              data: shown.map(pointDemand),
              borderColor: "#10b99f",
              backgroundColor: "rgba(16,185,159,.10)",
              fill: true,
              tension: 0.42,
              borderWidth: 2,
              pointRadius: large ? 2 : 0,
            },
          ],
        });
        setStatus("");
      } catch {
        if (mounted)
          setStatus(
            "Forecast failed to load. Please check the backend endpoint.",
          );
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [large, onBestTime]);

  if (!chartData) return <div className="chart-empty">{status}</div>;

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: large } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#64748b" } },
          y: {
            grid: { color: "rgba(100,116,139,.14)" },
            ticks: { color: "#64748b" },
          },
        },
      }}
    />
  );
}

function UpgradeButton({ label = "👑 Upgrade now", plan = "premier" }: { label?: string; plan?: string }) {
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

function PricingModal({ onClose }: { onClose: () => void }) {
  const [yearly, setYearly] = useState(false);
  const plans = [
    {
      key: "essential",
      name: "Essential",
      price: "£4.99",
      desc: "Everything you need to start saving on energy — right away.",
      period: "Monthly · cancel any time",
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
      price: "£9.99",
      desc: "Upload your bill, find overcharges, and get your home energy rating. Pays for itself.",
      period: "Monthly · cancel any time",
      popular: true,
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
      price: "£19.99",
      desc: "For landlords and homeowners who want to go further.",
      period: "Monthly · cancel any time",
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
                  ? <>£{({ essential: "49.90", premier: "99.90", elite: "199.90" } as any)[pl.key]}<span>/yr</span></>
                  : <>{pl.price}<span>/mo</span></>
                }
              </div>
              {yearly && (
                <div className="yearly-save">
                  Save £{({ essential: "9.98", premier: "19.98", elite: "39.98" } as any)[pl.key]} vs monthly
                </div>
              )}
              <p className="plan-period">{pl.period}</p>
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
            <strong style={{ fontSize: 14 }}>Managing 10+ properties or a business?</strong>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Evervia B2B covers multi-site dashboards, commercial EPC compliance, council & NHS pricing and dedicated account management.</p>
          </div>
          <a href="https://evervia.co.uk/" target="_blank" rel="noreferrer" className="btn outline" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>Visit Evervia →</a>
        </div>
      </div>
    </div>
  );
}

function Topbar({
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

function Sidebar({ user, onPricing }: { user: User; onPricing: () => void }) {
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
  const homeUsed = readJson<Record<string, ClaimedHome>>(HOME_KEY, {})[email]
    ? 1
    : 0;
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

function KpiRow({ live }: { live: any }) {
  const d = live || {};
  const cards = [
    [
      "GRID DEMAND",
      d.demand_gw ? `${Number(d.demand_gw).toFixed(1)} GW` : "—",
      d.demand_gw
        ? `Live · ${new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Loading…",
    ],
    [
      "FREQUENCY",
      d.frequency ? `${Number(d.frequency).toFixed(3)} Hz` : "—",
      "Nominal",
    ],
    [
      "RENEWABLE MIX",
      d.renewable_percentage
        ? `${Number(d.renewable_percentage).toFixed(1)}%`
        : "—",
      "High green mix",
    ],
    ["GRID STATUS", "Normal", "All systems stable"],
    [
      "CARBON INTENSITY",
      d.carbon_intensity ? `${d.carbon_intensity} g/kWh` : "—",
      d.carbon_index || "Normal",
    ],
    [
      "PRICE NOW",
      d.price_pkwh ? `${Number(d.price_pkwh).toFixed(1)}p/kWh` : "—",
      "Normal",
    ],
  ];
  return (
    <div className="kpis">
      {cards.map((c) => (
        <div className="kpi" key={c[0]}>
          <small>{c[0]}</small>
          <strong>{c[1]}</strong>
          <span>{c[2]}</span>
        </div>
      ))}
    </div>
  );
}

function BusinessIntelligence({
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
  const [result, setResult] = useState<Notice | null>(null);
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

function HomeEnergySavings({
  user,
  onPricing,
}: {
  user: User;
  onPricing: () => void;
}) {
  const [pc, setPc] = useState("");
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selected, setSelected] = useState<AddressItem | null>(null);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const tier = getTier(user);
  const email = user.email || "anon";
  const homeClaims = readJson<Record<string, ClaimedHome>>(HOME_KEY, {});

  async function searchAddresses() {
    const clean = normalisePostcode(pc);
    if (!clean) return;
    setLoading(true);
    setNotice(null);
    setAddresses([]);
    setSelected(null);
    setPropertyData(null);

    try {
      const data = await getAddress(clean);
      if (!data.ok) throw Object.assign(new Error(data.message || "Lookup failed"), { data });
      const list = extractAddresses(data);
      if (!list.length) {
        setNotice({
          tone: "warn",
          title: "No addresses returned.",
          body: "The postcode lookup worked, but the backend did not return an address list.",
        });
      } else {
        setAddresses(list);
        setNotice({
          tone: "good",
          title: `${list.length} addresses found`,
          body: "Select your property to view the EPC and savings intelligence.",
        });
      }
    } catch (e: any) {
      const code = e?.data?.code;
      if (code === "claimed") {
        setNotice({
          tone: "warn",
          title: "This home is already claimed.",
          body: "Someone has already linked this property. Upgrade to join this home or add it to your account.",
        });
      } else if (code === "already_used") {
        setNotice({
          tone: "warn",
          title: "Free home lookup already used.",
          body: "Upgrade to search another postcode or property.",
        });
      } else {
        setNotice({
          tone: "bad",
          title: "Address lookup failed.",
          body: e.message || "Please check the backend /address endpoint.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function selectAddress(a: AddressItem) {
    const clean = normalisePostcode(pc);
    const key = `${clean}:${a.label.toLowerCase()}`;
    const existing = Object.values(homeClaims).find(
      (x) => x.key === key && x.claimedBy !== email,
    );

    if (existing && tier === "free") {
      setSelected(a);
      setNotice({
        tone: "warn",
        title: "This home is already claimed.",
        body: "To join this household or access its energy profile, please upgrade.",
      });
      setPropertyData(null);
      return;
    }

    setSelected(a);

    if (tier === "free") {
      writeJson(HOME_KEY, {
        ...homeClaims,
        [email]: {
          key,
          postcode: clean,
          address: a.label,
          claimedBy: email,
          claimedAt: new Date().toISOString(),
        },
      });
      setNotice({
        tone: "warn",
        title: "Full EPC profile is a Premier feature.",
        body: "Upgrade to view ratings, floor area and savings report.",
      });
      setPropertyData(null);
      return;
    }

    setNotice({ tone: "info", title: "Loading EPC profile…", body: a.label });

    try {
      const token = await getToken();
      const res = await fetch(`${API}/property/${encodeURIComponent(clean)}/${encodeURIComponent(a.label)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data?.message || data?.error || "Property lookup failed"), { status: res.status, data });
      setPropertyData(data);
      setNotice({
        tone: "good",
        title: "EPC profile loaded.",
        body: "Review the property details below. Upgrade to unlock the full savings report.",
      });
    } catch (e: any) {
      if (e.status === 403) {
        setNotice({
          tone: "warn",
          title: "Property details are locked.",
          body: "Select saved. Upgrade to view the full EPC, improvement roadmap and savings report.",
        });
      } else {
        setNotice({
          tone: "bad",
          title: "Property lookup failed.",
          body:
            e.message ||
            "The backend property endpoint did not return details.",
        });
      }
      setPropertyData(null);
    }
  }

  return (
    <div className="panel" id="home-energy-savings">
      <div className="panel-title">🏠 Home Energy Savings</div>
      <div className="panel-sub">
        Enter your postcode, select your address, then unlock full savings
        intelligence
      </div>
      <div className="search-row">
        <input value={pc} onChange={(e) => setPc(e.target.value)} />
        <button
          className="btn outline"
          onClick={searchAddresses}
          disabled={loading}
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      {notice?.tone === "bad" && notice.title === "Address lookup failed." ? (
        <div className="notice bad">
          <strong>No EPC certificate found for {pc.toUpperCase()}.</strong>
          <p>
            This property may not have been sold or rented since 2008.{" "}
            <a
              href="https://find-an-assessor.digital.communities.gov.uk"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#00a889", fontWeight: 900 }}
            >
              Get an EPC assessment →
            </a>
          </p>
        </div>
      ) : (
        notice && (
          <div className={`notice ${notice.tone || "info"}`}>
            <strong>{notice.title}</strong>
            <p>{notice.body}</p>
            {notice.tone === "warn" && (
              <button className="btn primary" onClick={onPricing}>
                👑 Upgrade to continue
              </button>
            )}
          </div>
        )
      )}

      {!!addresses.length && (
        <div className="address-list">
          {addresses.slice(0, 100).map((a) => (
            <button
              key={a.label}
              className={`address ${selected?.label === a.label ? "active" : ""}`}
              onClick={() => selectAddress(a)}
            >
              <span>{a.label}</span>
              <em>Available</em>
              <b>›</b>
            </button>
          ))}
        </div>
      )}

      {propertyData && (
        <div className="property-card">
          <h3>Property energy profile</h3>
          <div className="property-grid">
            {propertyRows(propertyData).map(([k, v]) => (
              <div key={k}>
                <small>{k}</small>
                <strong>{String(v)}</strong>
              </div>
            ))}
          </div>
          <div className="soft-cta">
            <span>
              Full upgrade roadmap, cost savings and AI recommendations are
              available on Premier.
            </span>
            <button className="btn primary" onClick={onPricing}>
              Unlock full report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SavingsReport({ onPricing }: { onPricing: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [billPostcode, setBillPostcode] = useState("");
  const [billAddress, setBillAddress] = useState("");
  const [msg, setMsg] = useState("Available from Premier tier");
  async function upload() {
    if (!file) return;
    setMsg("Uploading bill…");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("postcode", billPostcode);
      fd.append("address", billAddress);
      const res = await fetch(`${API}/gridsense/bill/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw Object.assign(new Error(), { status: res.status });
      setMsg("Bill uploaded. Analysis will appear here.");
    } catch (e: any) {
      setMsg(e.status === 403 ? "Bill upload is a Premier feature." : "Upload failed.");
    }
  }
  return (
    <div className="panel" id="savings-report">
      <div className="panel-title">💰 Savings Report</div>
      <div className="panel-sub">
        Upload a PDF, JPEG or PNG energy bill to generate a personalised savings
        report.
      </div>
      <input
        className="savings-input"
        placeholder="Postcode for this bill"
        value={billPostcode}
        onChange={(e) => setBillPostcode(e.target.value)}
      />
      <input
        className="savings-input"
        placeholder="Address for this bill"
        value={billAddress}
        onChange={(e) => setBillAddress(e.target.value)}
      />
      <label className="upload">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <strong>{file ? file.name : "Choose bill file"}</strong>
        <span>{msg}</span>
      </label>
      <div className="notice warn">
        <strong>Bill upload is a Premier feature.</strong>
        <p>Upgrade to upload your bill and unlock AI savings analysis.</p>
        <button className="btn primary" onClick={file ? upload : onPricing}>
          {file ? "Upload bill" : "👑 Upgrade for bill analysis"}
        </button>
      </div>
    </div>
  );
}

function SupportModal({ onClose, user }: { onClose: () => void; user: User }) {
  return (
    <div className="modal-backdrop">
      <div className="support-modal">
        <button className="x" onClick={onClose}>
          ×
        </button>
        <h2>Contact support</h2>
        <p>Tell us what you need help with.</p>
        <input defaultValue={user.email || ""} placeholder="Email address" />
        <input placeholder="Phone number (optional)" />
        <input placeholder="Subject" />
        <textarea placeholder="What are you contacting us about?" />
        <button className="btn primary">Send message</button>
      </div>
    </div>
  );
}

function Dashboard({ user }: { user: User }) {
  const [live, setLive] = useState<any>(null);
  const [pricing, setPricing] = useState(false);
  const [support, setSupport] = useState(false);
  const [bestTime, setBestTime] = useState<string | null>(null);

  useEffect(() => {
    getLive()
      .then(setLive)
      .catch(() => {});
    const id = setInterval(
      () =>
        getLive()
          .then(setLive)
          .catch(() => {}),
      30000,
    );
    const open = () => setSupport(true);
    window.addEventListener("open-support", open as EventListener);
    return () => {
      clearInterval(id);
      window.removeEventListener("open-support", open as EventListener);
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="app-shell" id="dashboard">
      <Sidebar user={user} onPricing={() => setPricing(true)} />
      <main className="main">
        <Topbar
          user={user}
          onPricing={() => setPricing(true)}
          onSignOut={signOut}
        />
        <KpiRow live={live} />

        <div className="grid two">
          <div className="panel forecast-panel" id="forecast">
            <div className="panel-head">
              <div>
                <div className="panel-title">📈 48-Hour Demand Forecast</div>
                <div className="panel-sub">
                  AI-powered forecast · next demand windows shown
                </div>
              </div>
              <a href="#forecast-full">View full forecast →</a>
            </div>
            <div className="chart-wrap">
              <ForecastChart onBestTime={setBestTime} />
            </div>
            {bestTime && (
              <div className="insight-line">
                ⚡ Lowest predicted energy window: <strong>{bestTime}</strong>
              </div>
            )}
          </div>
          <BusinessIntelligence
            user={user}
            live={live}
            bestTime={bestTime}
            onPricing={() => setPricing(true)}
          />
        </div>

        <div className="grid three">
          <div className="locked-card">
            <span>🔒 Upgrade Required</span>
          </div>
          <HomeEnergySavings user={user} onPricing={() => setPricing(true)} />
          <SavingsReport onPricing={() => setPricing(true)} />
        </div>

        <div className="grid three">
          <div className="panel blur-card" id="alerts">
            <div className="panel-title">🔔 Alerts</div>
            <div className="locked">🔒 Upgrade Required</div>
          </div>
          <div className="panel blur-card" id="forecast-full">
            <div className="panel-title">📊 Full Forecast</div>
            <div className="chart-wrap small">
              <ForecastChart large onBestTime={setBestTime} />
            </div>
          </div>
          <div className="panel api" id="api-export">
            <div className="panel-title">🔑 API & Export</div>
            <div className="panel-sub">Available on Elite tier</div>
            <div className="codebox">
              Your API key and export tools appear here on Elite.
            </div>
          </div>
        </div>
        <Footer />
      </main>
      {pricing && <PricingModal onClose={() => setPricing(false)} />}
      {support && (
        <SupportModal user={user} onClose={() => setSupport(false)} />
      )}
    </div>
  );
}



const FAQ_ITEMS = [
  {
    q: "Is there a free GridSense plan?",
    a: "Yes. GridSense has a free starter access level for basic account access and limited preview usage. Essential is the first paid household plan at £4.99/month and unlocks live UK grid data, the 48-hour forecast, postcode alerts and the cheapest window indicator. Premier and Elite add bill analysis, EPC ratings, property intelligence and portfolio tools."
  },
  {
    q: "How accurate is the 48-hour forecast?",
    a: "GridSense uses a gradient boosting model trained on Elexon BMRS demand data and weather patterns. Current accuracy is 97% (R²=0.9701) on held-out test data. Forecasts are regenerated automatically as new grid data arrives."
  },
  {
    q: "What does the Home Energy Rating tool do?",
    a: "It looks up your address against official government EPC records. You get your home's current energy rating, floor area, heating type and tenure. On Premier, you also get the full property profile and a personalised savings report."
  },
  {
    q: "Can I upload any energy bill?",
    a: "Yes — PDF, JPEG or PNG bills from any UK supplier are supported. The AI reads your bill, compares usage and charges against the Ofgem price cap, and flags overcharges, wrong tariff classifications and missed savings. This is a Premier feature."
  },
  {
    q: "What is the Business Intelligence panel?",
    a: "It gives you postcode-level energy signals — carbon intensity, current price, renewable mix and the best predicted low-cost window for that area. Free users get one postcode per account. Premier and above get unlimited searches."
  },
  {
    q: "Does GridSense work for landlords?",
    a: "Yes. The Elite plan includes portfolio tracking for up to 5 properties, AI upgrade roadmaps ranked by saving potential, and legally required EPC compliance reports. For 10+ properties, Evervia B2B is the right product."
  },
  {
    q: "How does the savings calculator work?",
    a: "Enter your estimated daily saving — from a simple boiler flow temperature adjustment (£0.49/day) up to EV overnight charging savings (£2.08/day). The calculator compounds this to weekly, monthly and yearly figures so you can see the real impact."
  },
  {
    q: "Is my data secure?",
    a: "Yes. GridSense uses Supabase for authentication with row-level security. Bill files are processed and not stored beyond analysis. Payment is handled entirely by Stripe — GridSense never sees your card details."
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, any time. Cancel from your account billing portal and your plan stays active until the end of the current billing period. No cancellation fees, no questions asked."
  },
  {
    q: "What is the difference between GridSense and Evervia?",
    a: "GridSense is for households, individual landlords and developers. Evervia is the B2B platform built for SMEs, facilities managers, NHS trusts and local councils — with multi-site dashboards, commercial EPC compliance and dedicated account management."
  },
];

function FAQSection({ compact = false }: { compact?: boolean }) {
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

function Footer() {
  return (
    <footer className="gs-footer">
      <div className="gs-wrap">
        <div className="gs-footer-grid">
          <div className="gs-footer-brand">
            <a className="gs-brand" href="#top" style={{ color: "#fff" }}>
              <span className="gs-mark">ϟ</span>
              <div>
                <strong>GridSense</strong>
                <span style={{ color: "rgba(255,255,255,0.5)", display: "block", fontSize: 12 }}>by Evervia</span>
              </div>
            </a>
            <p>Live UK energy intelligence for households, landlords and developers. Powered by Elexon BMRS grid data and AI demand forecasting.</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
              © {new Date().getFullYear()} Evervia Innovations Ltd. All rights reserved.
            </p>
          </div>
          <div>
            <strong>Product</strong>
            <nav>
              <a href="#features">Features</a>
              <a href="#dashboard-preview">Dashboard</a>
              <a href="#pricing-preview">Pricing</a>
              <a href="#faq-preview">FAQ</a>
              <a href="#savings">How it saves you money</a>
            </nav>
          </div>
          <div>
            <strong>Plans</strong>
            <nav>
              <a href="#pricing-preview">Essential — £4.99/mo</a>
              <a href="#pricing-preview">Premier — £9.99/mo</a>
              <a href="#pricing-preview">Elite — £19.99/mo</a>
              <a href="https://evervia.co.uk/" target="_blank" rel="noreferrer">Evervia B2B →</a>
            </nav>
          </div>
          <div>
            <strong>Company</strong>
            <nav>
              <a href="https://evervia.co.uk/" target="_blank" rel="noreferrer">Evervia</a>
              <a href="mailto:info@evervia.co.uk">info@evervia.co.uk</a>
              <a onClick={() => window.dispatchEvent(new CustomEvent("open-support"))} style={{ cursor: "pointer" }}>Contact support</a>
              <a href="#faq-preview">Help & FAQ</a>
            </nav>
          </div>
        </div>
        <div className="gs-footer-bottom">
          <span>Data source: Elexon BMRS · Carbon Intensity API · OS Places API</span>
          <span>GridSense is not an energy supplier. Savings figures are estimates based on publicly available data.</span>
        </div>
      </div>
    </footer>
  );
}

function SavingsCalculator({ onStart }: { onStart: () => void }) {
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

function LandingPage({ onStart }: { onStart: () => void }) {
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
  const demand = live?.demand_gw
  const carbon = live?.carbon_intensity
  const price = live?.price_pkwh
  const updated = live?.timestamp || live?.date

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

function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user || null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    setErr("");
    setInfo("");
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Check your inbox to confirm your email before signing in. Also check spam/junk.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pw,
        });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e.message || "Authentication failed");
    }
  }

  async function resetPassword() {
    setErr("");
    if (!email) {
      setErr("Enter your email address first, then click forgot password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setErr(
      error ? error.message : "Password reset link sent. Check your inbox.",
    );
  }

  if (user) return <Dashboard user={user} />;
  if (!showAuth) return <LandingPage onStart={() => setShowAuth(true)} />;

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="logo big">ϟ</div>
        <h1>GridSense</h1>
        <p>Sign in to your energy intelligence dashboard.</p>
        <div className="tabs">
          <button
            className={tab === "login" ? "active" : ""}
            onClick={() => setTab("login")}
          >
            Log in
          </button>
          <button
            className={tab === "signup" ? "active" : ""}
            onClick={() => setTab("signup")}
          >
            Sign up
          </button>
        </div>
        <button
          className="btn outline wide-btn"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin },
            });
          }}
        >
          Continue with Google
        </button>
        {tab === "signup" && (
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {tab === "login" && (
          <button className="link-btn" onClick={resetPassword}>
            Forgot password?
          </button>
        )}
        {info && <div className="notice good"><p style={{ margin: 0 }}>{info}</p></div>}
        {err && <div className="error">{err}</div>}
        <button className="btn primary wide-btn" onClick={submit}>
          {tab === "signup" ? "Create account" : "Sign in"}
        </button>
        <button className="link-btn" onClick={() => setShowAuth(false)}>
          Back to overview
        </button>
      </div>
    </div>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      :root {
        --bg: #eef4fb;
        --card: #ffffff;
        --text: #071327;
        --muted: #5d6b82;
        --line: #d8e3ee;
        --teal: #10d7ba;
        --teal2: #00a889;
        --warn: #fff7ed;
        --bad: #fff1f2;
      }

      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family:
          Inter,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
      }
      button,
      input,
      textarea {
        font: inherit;
      }
      a {
        text-decoration: none;
      }

      .app-shell {
        display: grid;
        grid-template-columns: 290px 1fr;
        gap: 16px;
        padding: 16px;
        min-height: 100vh;
      }
      .sidebar {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 28px 18px;
        position: sticky;
        top: 16px;
        height: calc(100vh - 32px);
        display: flex;
        flex-direction: column;
        gap: 28px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
      }
      .sidebar::-webkit-scrollbar { width: 8px; }
      .sidebar::-webkit-scrollbar-track { background: transparent; }
      .sidebar::-webkit-scrollbar-thumb { background: #d7e1ea; border-radius: 999px; }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--text);
      }
      .logo {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--teal), #03b393);
        display: grid;
        place-items: center;
        font-weight: 900;
        color: #04211d;
      }
      .logo.big {
        margin: auto;
        width: 54px;
        height: 54px;
        font-size: 28px;
      }
      .brand strong {
        font-size: 22px;
      }
      .brand span {
        display: block;
        color: var(--muted);
        font-size: 12px;
        margin-top: 4px;
      }
      .sidebar nav {
        display: grid;
        gap: 12px;
      }
      .sidebar nav a {
        padding: 14px 16px;
        border-radius: 999px;
        color: #26374d;
        font-weight: 800;
      }
      .sidebar nav a:hover,
      .sidebar nav a:first-child {
        background: #e7fbf6;
        color: #00a889;
      }

      .limit-card,
      .support {
        margin-top: auto;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 16px;
        background: #fbfdff;
        text-align: left;
      }
      .limit-card p {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 13px;
      }
      .bar {
        height: 5px;
        background: #e6eef7;
        border-radius: 99px;
        margin: 8px 0 18px;
      }
      .bar span {
        display: block;
        height: 100%;
        width: 100%;
        background: var(--teal2);
        border-radius: 99px;
      }
      .support {
        margin-top: 0;
        color: #50627a;
        cursor: pointer;
      }

      .main {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }
      .topbar {
        height: 76px;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: #fff;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        padding: 0 24px;
        position: sticky;
        top: 16px;
        z-index: 10;
      }
      .pill {
        border: 1px solid var(--line);
        background: #f8fbff;
        border-radius: 999px;
        padding: 12px 18px;
        font-weight: 900;
        color: #607087;
      }
      .upgrade,
      .btn {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px 18px;
        background: #fff;
        font-weight: 900;
        cursor: pointer;
      }
      .btn.primary,
      .upgrade {
        border: 0;
        color: #05231e;
        background: linear-gradient(135deg, var(--teal), #03b393);
        box-shadow: 0 14px 30px rgba(16, 215, 186, 0.22);
      }
      .btn.outline {
        color: #00a889;
        border-color: #a8eee2;
      }
      .wide-btn {
        width: 100%;
      }
      .plain {
        border: 0;
        background: transparent;
        cursor: pointer;
      }
      .avatar {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        border: 1px solid var(--line);
        font-weight: 900;
      }
      .who strong {
        display: block;
      }
      .who span {
        display: block;
        color: var(--muted);
        font-size: 12px;
      }

      .kpis {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 14px;
      }
      .kpi,
      .panel,
      .locked-card {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 22px;
      }
      .kpi small {
        font-size: 11px;
        color: #7b89a1;
        font-weight: 900;
        letter-spacing: 0.08em;
      }
      .kpi strong {
        display: block;
        font-size: 26px;
        margin: 12px 0 8px;
      }
      .kpi span {
        color: #00a889;
        font-size: 12px;
      }

      .grid {
        display: grid;
        gap: 16px;
      }
      .two {
        grid-template-columns: 1.45fr 1fr;
      }
      .three {
        grid-template-columns: 1fr 1fr 1fr;
      }
      .panel-title {
        font-size: 20px;
        font-weight: 950;
        margin-bottom: 8px;
      }
      .panel-sub {
        color: #52637a;
        font-size: 13px;
        line-height: 1.6;
      }
      .panel-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .panel-head a {
        color: #155eef;
        font-weight: 900;
        font-size: 14px;
      }
      .forecast-panel {
        min-height: 345px;
      }
      .chart-wrap {
        height: 250px;
        display: grid;
        place-items: center;
      }
      .chart-wrap.small {
        height: 230px;
      }
      .chart-empty {
        color: #53657d;
        text-align: center;
      }
      .insight-line {
        margin-top: 12px;
        border: 1px solid #a8eee2;
        background: #f0fdfa;
        border-radius: 12px;
        padding: 12px;
        color: #075e53;
      }

      .search-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        margin: 18px 0;
      }
      .search-row input,
      .auth-card input,
      .support-modal input,
      .support-modal textarea {
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 14px 16px;
        background: #f8fbff;
        outline: none;
      }
      .notice {
        border: 1px solid var(--line);
        background: #f8fbff;
        border-radius: 12px;
        padding: 16px;
        margin-top: 12px;
        white-space: pre-line;
        line-height: 1.6;
      }
      .notice.good {
        background: #f0fdfa;
        border-color: #b8efe5;
      }
      .notice.warn {
        background: var(--warn);
        border-color: #fed7aa;
      }
      .notice.bad {
        background: var(--bad);
        border-color: #fecdd3;
      }

      .address-list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
        max-height: 290px;
        overflow: auto;
      }
      .address {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 12px;
        align-items: center;
        text-align: left;
        border: 1px solid var(--line);
        background: #fff;
        border-radius: 10px;
        padding: 14px;
        cursor: pointer;
      }
      .address:hover,
      .address.active {
        border-color: #00a889;
      }
      .address em {
        background: #dcfce7;
        color: #16a34a;
        border-radius: 999px;
        padding: 6px 10px;
        font-style: normal;
        font-size: 12px;
        font-weight: 900;
      }

      .property-card {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 18px;
        margin-top: 16px;
        background: #fbfdff;
      }
      .property-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .property-grid div {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 12px;
      }
      .property-grid small {
        display: block;
        color: #64748b;
      }
      .soft-cta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-top: 14px;
        border: 1px solid #b8efe5;
        background: #f0fdfa;
        padding: 12px;
        border-radius: 12px;
        color: #075e53;
      }

      .upload {
        display: grid;
        border: 1px dashed #8eeade;
        border-radius: 14px;
        padding: 24px;
        margin: 18px 0;
        cursor: pointer;
        background: #fbfffe;
      }
      .upload input {
        display: none;
      }
      .upload span {
        color: #8a98aa;
        margin-top: 8px;
      }
      .locked-card {
        min-height: 390px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.72);
        color: #6b7a91;
        font-weight: 900;
      }
      .blur-card {
        min-height: 190px;
      }
      .locked {
        height: 120px;
        display: grid;
        place-items: center;
        color: #6b7a91;
        font-weight: 900;
      }
      .codebox {
        border: 1px solid var(--line);
        background: #f8fbff;
        padding: 18px;
        border-radius: 12px;
        margin-top: 16px;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.62);
        z-index: 100;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .modal,
      .support-modal,
      .auth-card {
        background: #fff;
        border-radius: 22px;
        padding: 34px;
        width: min(920px, 96vw);
        position: relative;
      }
      .support-modal {
        display: grid;
        gap: 12px;
        width: min(520px, 94vw);
      }
      .support-modal textarea {
        min-height: 130px;
        resize: vertical;
      }
      .x {
        position: absolute;
        right: 18px;
        top: 14px;
        border: 0;
        background: transparent;
        font-size: 28px;
        cursor: pointer;
      }
      .eyebrow {
        text-transform: uppercase;
        color: #00a889;
        letter-spacing: 0.18em;
        font-size: 12px;
        font-weight: 900;
        text-align: center;
      }
      .modal h2 {
        text-align: center;
        font-size: 30px;
      }
      .modal-sub { text-align:center; color: var(--muted); margin: 8px 0 0; }
      .pricing-modal { width: min(1180px, 96vw); max-height: 90vh; overflow-y: auto; }
      .plan { position: relative; display: flex; flex-direction: column; gap: 10px; }
      .plan.pop { border-color: rgba(109, 40, 217, .32); box-shadow: 0 24px 70px rgba(109,40,217,.10); }
      .plan.faded { background: #f8fafc; opacity: .78; }
      .plan-desc, .plan-period { color: var(--muted); font-size: 13px; line-height: 1.6; margin: 0; }
      .plan-inherit { border: 1px solid rgba(20,184,166,.28); background: #ecfdf7; color: #009b84; padding: 11px; border-radius: 10px; font-size: 12px; font-weight: 900; }
      .plan-features { list-style: none; padding: 0; margin: 8px 0 18px; display: grid; gap: 10px; }
      .plan-features li { font-size: 13px; color: #334155; line-height: 1.45; }
      .plan-features li:before { content: "✓"; color: #00a889; font-weight: 900; margin-right: 8px; }
      .pop-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #6d28d9; color: white; border-radius: 999px; padding: 7px 14px; font-size: 10px; font-weight: 950; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
      .btn.full { width: 100%; }
      .gs-saving-big { font-size: 92px; font-weight: 950; letter-spacing: -6px; margin: 10px 0; background: linear-gradient(135deg, #6d28d9, #1fd4b0); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .gs-savings-cards { display: grid; gap: 14px; }
      .gs-savings-cards div { background: #fff; border: 1px solid rgba(15,23,42,.09); border-radius: 22px; padding: 22px; box-shadow: 0 14px 38px rgba(15,23,42,.055); }
      .gs-savings-cards p { font-size: 14px; margin: 8px 0; }
      .gs-savings-cards strong { color: #0fb89a; }
      .gs-price-grid.four { grid-template-columns: repeat(4, 1fr); }
      .gs-price-grid .b2b { background: #f8fafc; opacity: .78; }
      .gs-price-grid .b2b strong, .gs-price-grid .b2b h3 { color: #64748b; }
      .gs-price-grid .b2b a { display: inline-block; margin-top: 14px; color: #64748b; font-weight: 900; }

      .plans {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 28px;
      }
      .plan {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 24px 20px;
      }
      .price {
        font-size: 34px;
        font-weight: 950;
        margin: 18px 0;
      }
      .price span {
        color: var(--muted);
        font-size: 14px;
      }

      .auth {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 50% 0%, #d7fff7, transparent 38%), var(--bg);
      }
      .auth-card {
        width: min(420px, 94vw);
        text-align: center;
        display: grid;
        gap: 12px;
      }
      .tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        background: #f1f5f9;
        border-radius: 12px;
        padding: 4px;
      }
      .tabs button {
        border: 0;
        background: transparent;
        padding: 10px;
        border-radius: 10px;
        font-weight: 900;
      }
      .tabs .active {
        background: #fff;
      }
      .error {
        background: #fff1f2;
        border: 1px solid #fecdd3;
        padding: 10px;
        border-radius: 10px;
        color: #be123c;
      }

      .gs-landing {
        min-height: 100vh;
        background: #f4f7fc;
        color: #0d1b2e;
      }
      .gs-wrap {
        width: min(1200px, calc(100% - 40px));
        margin: 0 auto;
      }
      .gs-header {
        position: sticky;
        top: 0;
        z-index: 20;
        background: rgba(255, 255, 255, 0.86);
        backdrop-filter: blur(18px);
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      }
      .gs-nav {
        min-height: 76px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }
      .gs-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 900;
        font-size: 21px;
        color: #0d1b2e;
      }
      .gs-brand em {
        font-style: normal;
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
      }
      .gs-mark {
        width: 40px;
        height: 40px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #1fd4b0, #0fb89a);
        color: #04211d;
        font-weight: 900;
        box-shadow: 0 12px 28px rgba(31, 212, 176, 0.26);
      }
      .gs-links {
        display: flex;
        gap: 28px;
        color: #334155;
        font-size: 14px;
        font-weight: 800;
      }
      .gs-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .gs-link {
        border: 0;
        background: transparent;
        color: #0d1b2e;
        font-weight: 900;
        cursor: pointer;
      }
      .gs-btn {
        border: 1px solid rgba(15, 23, 42, 0.1);
        border-radius: 14px;
        padding: 13px 20px;
        font-weight: 900;
        cursor: pointer;
        transition: 0.22s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .gs-btn:hover {
        transform: translateY(-2px);
      }
      .gs-primary {
        background: linear-gradient(135deg, #1fd4b0, #0fb89a);
        color: #031a16;
        border: 0;
        box-shadow: 0 18px 36px rgba(31, 212, 176, 0.24);
      }
      .gs-secondary {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.18);
        color: #fff;
      }
      .gs-hero {
        position: relative;
        overflow: hidden;
        padding: 92px 0 110px;
        background:
          radial-gradient(circle at 75% 25%, rgba(109, 40, 217, 0.28), transparent 28%),
          radial-gradient(circle at 22% 42%, rgba(31, 212, 176, 0.22), transparent 30%),
          linear-gradient(145deg, #06101f, #071126 55%, #0b1730);
        color: #fff;
      }
      .gs-hero::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 72px 72px;
        mask-image: radial-gradient(circle at center, black, transparent 78%);
      }
      .gs-hero-grid {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: 0.92fr 1.08fr;
        gap: 52px;
        align-items: center;
      }
      .gs-pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 9px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        color: rgba(255,255,255,0.78);
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .5px;
        margin-bottom: 26px;
      }
      .gs-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #1fd4b0;
        box-shadow: 0 0 0 8px rgba(31,212,176,0.12);
      }
      .gs-copy h1 {
        font-size: clamp(54px, 6vw, 88px);
        line-height: 0.94;
        letter-spacing: -4px;
        margin: 0 0 26px;
      }
      .gs-copy h1 span {
        background: linear-gradient(135deg, #1fd4b0, #a7f3d0);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .gs-copy p {
        color: rgba(255,255,255,0.72);
        font-size: 18px;
        line-height: 1.75;
        max-width: 590px;
        margin: 0 0 32px;
      }
      .gs-hero-actions {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-bottom: 34px;
      }
      .gs-trust {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
        color: rgba(255,255,255,0.62);
        font-size: 13px;
        font-weight: 800;
      }
      .gs-preview {
        background: rgba(255,255,255,0.09);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 32px;
        padding: 22px;
        box-shadow: 0 50px 120px rgba(0,0,0,0.32);
        backdrop-filter: blur(20px);
      }
      .gs-preview-top,
      .gs-chart-head,
      .gs-insight-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }
      .gs-preview-top {
        margin-bottom: 18px;
      }
      .gs-preview-top span {
        color: #1fd4b0;
        font-size: 12px;
        font-weight: 900;
      }
      .gs-kpi-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 14px;
      }
      .gs-kpi-row div,
      .gs-chart-card,
      .gs-insight-row div {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.11);
        border-radius: 20px;
        padding: 18px;
      }
      .gs-kpi-row small,
      .gs-chart-head small,
      .gs-insight-row span {
        display: block;
        color: rgba(255,255,255,0.55);
        font-size: 12px;
        margin-top: 5px;
      }
      .gs-kpi-row strong {
        display: block;
        font-size: 24px;
        margin: 8px 0 2px;
      }
      .gs-kpi-row em {
        font-style: normal;
        color: #1fd4b0;
        font-size: 12px;
        font-weight: 800;
      }
      .gs-chart-head a {
        color: #8ff8dd;
        cursor: pointer;
        font-weight: 900;
      }
      .gs-bars {
        height: 190px;
        display: flex;
        align-items: end;
        gap: 10px;
        padding-top: 24px;
      }
      .gs-bars span {
        flex: 1;
        min-height: 25px;
        border-radius: 12px 12px 4px 4px;
        background: linear-gradient(180deg, #1fd4b0, #2563eb);
        opacity: .9;
      }
      .gs-insight-row {
        margin-top: 14px;
      }
      .gs-insight-row div {
        flex: 1;
      }
      .gs-section {
        padding: 92px 0;
      }
      .gs-section-head {
        text-align: center;
        max-width: 760px;
        margin: 0 auto 46px;
      }
      .gs-section-head span,
      .gs-mini {
        color: #0fb89a;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 2px;
      }
      .gs-section-head h2,
      .gs-savings h2,
      .gs-footer-cta h2 {
        font-size: clamp(34px, 4vw, 56px);
        letter-spacing: -2px;
        line-height: 1.05;
        margin: 12px 0 16px;
      }
      .gs-section-head p,
      .gs-savings p,
      .gs-footer-cta p {
        color: #64748b;
        line-height: 1.75;
        font-size: 17px;
      }
      .gs-feature-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }
      .gs-feature-grid div,
      .gs-price-grid div,
      .gs-saving-card {
        background: #fff;
        border: 1px solid rgba(15, 23, 42, 0.09);
        border-radius: 28px;
        padding: 30px;
        box-shadow: 0 14px 38px rgba(15,23,42,0.055);
      }
      .gs-feature-grid span {
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: rgba(31,212,176,.12);
        margin-bottom: 20px;
        font-size: 24px;
      }
      .gs-feature-grid h3 {
        font-size: 20px;
        margin: 0 0 10px;
      }
      .gs-feature-grid p,
      .gs-price-grid p {
        color: #64748b;
        line-height: 1.7;
        margin: 0;
      }
      .gs-savings {
        padding: 92px 0;
        background: #fff;
      }
      .gs-savings-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 34px;
        align-items: center;
      }
      .gs-saving-card strong {
        display: block;
        font-size: 88px;
        letter-spacing: -5px;
        margin: 14px 0;
        background: linear-gradient(135deg, #6d28d9, #1fd4b0);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .gs-price-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }
      .gs-price-grid h3 {
        font-size: 22px;
        margin: 0 0 12px;
      }
      .gs-price-grid strong {
        display: block;
        font-size: 34px;
        margin-bottom: 12px;
      }
      .gs-price-grid .featured {
        border-color: rgba(109, 40, 217, 0.28);
        box-shadow: 0 24px 70px rgba(109,40,217,.12);
      }
      .gs-price-grid em {
        display: inline-block;
        font-style: normal;
        background: #6d28d9;
        color: #fff;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 900;
        margin-bottom: 14px;
      }
      .gs-center {
        text-align: center;
        margin-top: 28px;
      }
      .gs-footer-cta {
        text-align: center;
        padding: 84px 0 96px;
        background: #071126;
        color: #fff;
        margin: 0;
        border-bottom: 1px solid #071126;
      }
      .gs-footer-cta p {
        color: rgba(255,255,255,.65);
        margin-bottom: 24px;
      }
        
      @media (max-width: 1050px) {
        .gs-hero-grid,
        .gs-savings-grid {
          grid-template-columns: 1fr;
        }
        .gs-links {
          display: none;
        }
        .gs-feature-grid,
        .gs-price-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 720px) {
        .gs-wrap {
          width: min(100% - 24px, 1200px);
        }
        .gs-nav {
          min-height: 68px;
        }
        .gs-actions .gs-link {
          display: none;
        }
        .gs-hero {
          padding: 58px 0 70px;
        }
        .gs-copy h1 {
          font-size: 46px;
          letter-spacing: -2px;
        }
        .gs-kpi-row,
        .gs-feature-grid,
        .gs-price-grid,
        .gs-insight-row {
          grid-template-columns: 1fr;
          display: grid;
        }
        .gs-saving-card strong {
          font-size: 64px;
        }
      }
      .link-btn {
        border: 0;
        background: transparent;
        color: #00a889;
        font-weight: 900;
        cursor: pointer;
        padding: 4px;
      }

      @media (max-width: 1100px) {
        .app-shell {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: relative;
          height: auto;
        }
        .kpis,
        .two,
        .three {
          grid-template-columns: 1fr 1fr;
        }
        .plans {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 720px) {
        .kpis,
        .two,
        .three,
        .plans,
        .property-grid {
          grid-template-columns: 1fr;
        }
        .topbar {
          height: auto;
          flex-wrap: wrap;
          padding: 14px;
        }
        .app-shell {
          padding: 10px;
        }
        .soft-cta {
          display: grid;
        }
        .landing-grid {
          grid-template-columns: 1fr;
        }
        .landing-card {
          padding: 30px;
        }
      }

      .faq-list { display: grid; gap: 8px; }
      .faq-item { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: #fff; }
      .faq-item.open { border-color: #a8eee2; }
      .faq-item button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; border: 0; background: transparent; text-align: left; font-weight: 700; cursor: pointer; font-size: 13px; }
      .faq-item.open button { color: #00a889; }
      .faq-item em { font-style: normal; font-size: 20px; font-weight: 300; color: #94a3b8; flex-shrink: 0; }
      .faq-item p { margin: 0; padding: 0 16px 14px; font-size: 13px; color: #52637a; line-height: 1.7; }
      .faq-compact .faq-item button { padding: 10px 12px; font-size: 12px; }
      .faq-compact .faq-item p { font-size: 12px; padding: 0 12px 10px; }
      .faq-sidebar {
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 14px;
        background: #fbfdff;
        max-height: min(34vh, 320px);
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
      }
      .faq-sidebar .faq-compact {
        max-height: none;
        overflow: visible;
      }
      .faq-sidebar::-webkit-scrollbar { width: 8px; }
      .faq-sidebar::-webkit-scrollbar-track { background: #eef4f8; border-radius: 999px; }
      .faq-sidebar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
      .faq-sidebar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

      .gs-footer { background: #040d1a; color: rgba(255,255,255,0.65); padding: 64px 0 0; border-top: 1px solid rgba(255,255,255,0.06); }
      .gs-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .gs-footer-brand p { font-size: 13px; line-height: 1.75; color: rgba(255,255,255,0.45); margin: 16px 0 0; max-width: 280px; }
      .gs-footer strong { display: block; color: #fff; font-size: 13px; font-weight: 900; margin-bottom: 16px; letter-spacing: 0.04em; }
      .gs-footer nav { display: grid; gap: 10px; }
      .gs-footer nav a { font-size: 13px; color: rgba(255,255,255,0.5); transition: color 0.2s; }
      .gs-footer nav a:hover { color: #1fd4b0; }
      .gs-footer-bottom { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 20px 0; font-size: 11px; color: rgba(255,255,255,0.28); }
      @media (max-width: 900px) { .gs-footer-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 560px) { .gs-footer-grid { grid-template-columns: 1fr; } .gs-footer-bottom { flex-direction: column; } }

      .three-plans { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .billing-toggle { display: inline-flex; background: #f1f5f9; border-radius: 12px; padding: 4px; gap: 4px; margin: 20px auto; }
      .billing-toggle button { border: 0; background: transparent; padding: 10px 18px; border-radius: 10px; font-weight: 900; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; }
      .billing-toggle button.active { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .billing-toggle em { font-style: normal; background: linear-gradient(135deg, #1fd4b0, #0fb89a); color: #031a16; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 900; }
      .yearly-save { font-size: 12px; color: #00a889; font-weight: 900; margin-top: -8px; margin-bottom: 8px; }
    `}</style>
  );
}
export default function Page() {
  return (
    <>
      <Styles />
      <AuthGate />
    </>
  );
}
