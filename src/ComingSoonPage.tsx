export default function ComingSoonPage() {
  return (
    <main className="cs-shell">
      <style>{`
        :root {
          color-scheme: light;
        }

        body {
          margin: 0;
          background: #f1f1ed;
        }

        .cs-shell {
          --ink: #0b0b0b;
          --paper: #f1f1ed;
          --muted: #6c6c65;
          min-height: 100svh;
          width: 100%;
          overflow: hidden;
          position: relative;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: clamp(24px, 4vw, 56px);
          padding: clamp(20px, 3.2vw, 48px);
          background: var(--paper);
          color: var(--ink);
          font-family: Inter, Arial, Helvetica, sans-serif;
          isolation: isolate;
        }

        .cs-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0.13;
          background-image:
            linear-gradient(to right, transparent calc(25% - .5px), #0b0b0b 25%, transparent calc(25% + .5px)),
            linear-gradient(to right, transparent calc(50% - .5px), #0b0b0b 50%, transparent calc(50% + .5px)),
            linear-gradient(to right, transparent calc(75% - .5px), #0b0b0b 75%, transparent calc(75% + .5px));
        }

        .cs-top {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 18px;
          padding-top: 12px;
          border-top: 2px solid var(--ink);
          font-size: 10px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .cs-label {
          margin-bottom: 4px;
          color: var(--muted);
        }

        .cs-hero {
          align-self: center;
          display: grid;
          gap: clamp(18px, 2vw, 30px);
        }

        .cs-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .15em;
          text-transform: uppercase;
        }

        .cs-dot {
          width: 7px;
          height: 7px;
          flex: none;
          border-radius: 50%;
          background: var(--ink);
        }

        .cs-title {
          margin: 0;
          max-width: 8.2ch;
          font-size: clamp(64px, 12vw, 184px);
          line-height: .78;
          font-weight: 900;
          letter-spacing: -.08em;
          text-transform: uppercase;
        }

        .cs-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr;
          min-height: 154px;
          border-top: 2px solid var(--ink);
          border-bottom: 1px solid var(--ink);
        }

        .cs-cell {
          min-width: 0;
          padding: 16px 16px 18px 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
        }

        .cs-cell + .cs-cell {
          padding-left: 16px;
          border-left: 1px solid var(--ink);
        }

        .cs-kicker {
          color: var(--muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .cs-copy {
          max-width: 24ch;
          font-size: clamp(18px, 1.8vw, 27px);
          line-height: 1.04;
          font-weight: 700;
          letter-spacing: -.035em;
        }

        .cs-small {
          max-width: 34ch;
          font-size: 12px;
          line-height: 1.4;
        }

        .cs-sizing {
          font-size: clamp(16px, 1.45vw, 22px);
          line-height: 1.08;
          font-weight: 800;
          letter-spacing: -.03em;
          text-transform: uppercase;
        }

        .cs-footer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          padding-top: 12px;
          border-top: 1px solid var(--ink);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .cs-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .cs-status::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ink);
        }

        @media (max-width: 760px) {
          .cs-shell {
            padding: 18px;
            gap: 24px;
          }

          .cs-shell::before {
            display: none;
          }

          .cs-top {
            grid-template-columns: 1fr 1fr;
            row-gap: 14px;
          }

          .cs-hide-mobile {
            display: none;
          }

          .cs-title {
            font-size: clamp(66px, 21vw, 120px);
            line-height: .81;
          }

          .cs-grid {
            grid-template-columns: 1fr;
            border-bottom: 0;
          }

          .cs-cell,
          .cs-cell + .cs-cell {
            min-height: 116px;
            padding: 14px 0;
            border-left: 0;
            border-bottom: 1px solid var(--ink);
          }

          .cs-footer {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>

      <header className="cs-top">
        <div>
          <div className="cs-label">Status</div>
          <div>Under Construction</div>
        </div>
        <div>
          <div className="cs-label">Focus</div>
          <div>Personalized Apparel</div>
        </div>
        <div className="cs-hide-mobile">
          <div className="cs-label">Release</div>
          <div>Coming Soon</div>
        </div>
      </header>

      <section className="cs-hero" aria-labelledby="coming-soon-title">
        <div className="cs-eyebrow">
          <span className="cs-dot" aria-hidden="true" />
          Custom clothing, made personal
        </div>

        <h1 id="coming-soon-title" className="cs-title">
          Coming<br />Soon.
        </h1>

        <div className="cs-grid">
          <div className="cs-cell">
            <div className="cs-kicker">01 — Personalized / Custom / Made to Order</div>
            <div className="cs-copy">Custom clothing made around you.</div>
          </div>

          <div className="cs-cell">
            <div className="cs-kicker">02 — Apparel</div>
            <div className="cs-small">
              Personalized apparel, custom designs and made-to-order pieces — created around your name, idea and size.
            </div>
          </div>

          <div className="cs-cell">
            <div className="cs-kicker">03 — Sizing</div>
            <div className="cs-sizing">Adult Sizes / Custom Sizing</div>
          </div>
        </div>
      </section>

      <footer className="cs-footer">
        <div className="cs-status">Private rebuild in progress</div>
        <div>© 2026 MYBABYSHIRE — All rights reserved</div>
      </footer>
    </main>
  );
}
