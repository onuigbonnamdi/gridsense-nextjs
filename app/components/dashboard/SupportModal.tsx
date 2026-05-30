"use client";

import type { User } from "@supabase/supabase-js";

export function SupportModal({ onClose, user }: { onClose: () => void; user: User }) {
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
