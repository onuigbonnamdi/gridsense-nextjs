"use client";

export function Styles() {
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
      .gs-savings-cards div { background: #fff; border: 1px solid rgba(15, 23, 42, .09); border-radius: 22px; padding: 22px; box-shadow: 0 14px 38px rgba(15,23,42,.055); }
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
        box-shadow: 0 14px 38px rgba(15,23,42,.055);
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
