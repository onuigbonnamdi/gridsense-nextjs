"use client";

import { useState } from "react";
import { getAddress, getToken, API } from "@/lib/api";
import { getTier } from "@/lib/supabase";
import { normalisePostcode, readJson, writeJson, extractAddresses, propertyRows } from "@/app/lib/helpers";
import { HOME_KEY } from "@/app/lib/types";
import type { User } from "@supabase/supabase-js";
import type { AddressItem, ClaimedHome, Notice } from "@/app/lib/types";

export function HomeEnergySavings({
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
          body: e.message || "The backend property endpoint did not return details.",
        });
      }
      setPropertyData(null);
    }
  }

  return (
    <div className="panel" id="home-energy-savings">
      <div className="panel-title">🏠 Home Energy Savings</div>
      <div className="panel-sub">
        Enter your postcode, select your address, then unlock full savings intelligence
      </div>

      <div className="search-row">
        <input value={pc} onChange={(e) => setPc(e.target.value)} />
        <button className="btn outline" onClick={searchAddresses} disabled={loading}>
          {loading ? "…" : "Search"}
        </button>
      </div>

      {notice?.tone === "bad" && notice.title === "Address lookup failed." ? (
        <div className="notice bad">
          <strong>No EPC certificate found for {pc.toUpperCase()}.</strong>
          <p>
            This property may not have been sold or rented since 2008. 
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
              Full upgrade roadmap, cost savings and AI recommendations are available on Premier.
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
