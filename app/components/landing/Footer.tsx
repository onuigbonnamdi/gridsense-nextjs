"use client";

export function Footer() {
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
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 8 }}>
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
