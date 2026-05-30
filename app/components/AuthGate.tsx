"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Dashboard } from "@/app/components/Dashboard";
import { LandingPage } from "@/app/components/LandingPage";

// --- Pre-launch gating -------------------------------------------------
// Public sees the landing page only; CTAs go to the Tally waitlist.
// Flip LAUNCHED to true (or set NEXT_PUBLIC_LAUNCHED=true) to open auth to everyone.
const LAUNCHED = process.env.NEXT_PUBLIC_LAUNCHED === "true";
const WAITLIST_URL = "https://tally.so/r/Y5kYAB";
// Founder secret unlock: visit gridsense.evervia.co.uk/?dev=YOUR_SECRET_KEY
// Change this string to your own secret. Keep it out of public docs.
const DEV_KEY = "gridsense2026#";
// ----------------------------------------------------------------------

export function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [devUnlocked, setDevUnlocked] = useState(false);
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

  // Check for founder dev unlock via ?dev=KEY (persisted for the session).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("dev") === DEV_KEY) {
        sessionStorage.setItem("gs_dev", "1");
      }
      if (sessionStorage.getItem("gs_dev") === "1") {
        setDevUnlocked(true);
      }
    } catch {
      /* no-op (SSR / storage blocked) */
    }
  }, []);

  // Auth is open if the app has launched OR the founder unlocked dev access.
  const authOpen = LAUNCHED || devUnlocked;

  function handleStart() {
    if (authOpen) {
      setShowAuth(true);
    } else {
      window.location.href = WAITLIST_URL;
    }
  }

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

  // A logged-in founder always reaches the dashboard. If somehow logged in
  // pre-launch without dev access, fall through to the landing page.
  if (user && authOpen) return <Dashboard user={user} />;
  if (!showAuth) return <LandingPage onStart={handleStart} />;

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