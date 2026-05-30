import type { AddressItem, Notice, ClaimedHome } from "@/app/lib/types";

import type { User } from "@supabase/supabase-js";

export function normalisePostcode(v: string) {
  return (v || "").toUpperCase().replace(/\s+/g, "");
}

export function displayPostcode(v: string) {
  const pc = normalisePostcode(v);
  return pc.length > 3 ? `${pc.slice(0, -3)} ${pc.slice(-3)}` : pc;
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function firstName(user: User | null) {
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

export function forecastPoints(payload: any): any[] {
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

export function pointTime(p: any) {
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

export function pointDemand(p: any) {
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

export function pointPrice(p: any) {
  const v =
    p.price_pkwh ?? p.price_p_kwh ?? p.price ?? p.p_per_kwh ?? p.unit_rate;
  return v == null ? null : Number(v);
}

export function formatBestTimeFromForecast(payload: any) {
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

export function addressLabel(x: any) {
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

export function extractAddresses(payload: any): AddressItem[] {
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

export function propertyRows(data: any) {
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
