"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getLive } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import { Sidebar } from "@/app/components/dashboard/Sidebar";
import { Topbar } from "@/app/components/dashboard/Topbar";
import { KpiRow } from "@/app/components/dashboard/KpiRow";
import { ForecastChart } from "@/app/components/dashboard/ForecastChart";
import { BusinessIntelligence } from "@/app/components/dashboard/BusinessIntelligence";
import { HomeEnergySavings } from "@/app/components/dashboard/HomeEnergySavings";
import { SavingsReport } from "@/app/components/dashboard/SavingsReport";
import { Footer } from "@/app/components/landing/Footer";
import { PricingModal } from "@/app/components/dashboard/PricingModal";
import { SupportModal } from "@/app/components/dashboard/SupportModal";

export function Dashboard({ user }: { user: User }) {
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
