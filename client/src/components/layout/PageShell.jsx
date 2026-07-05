import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import "./PageShell.css";

export default function PageShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="page-shell">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="mobile-header__toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-header__brand">
          <img
            src="/nexora-icon.png"
            alt="Nexora"
            className="mobile-header__logo"
            style={{
              width: 24,
              height: 24,
              objectFit: "contain",
              borderRadius: 4,
            }}
          />
          <span className="mobile-header__brand-text">Nexora</span>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="page-shell__backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="page-shell__content">
        <div className="page-shell__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
