"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { API } from "@/lib/api";

export function SavingsReport({ onPricing }: { onPricing: () => void }) {
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
