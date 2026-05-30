"use client";

export function KpiRow({ live }: { live: any }) {
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
