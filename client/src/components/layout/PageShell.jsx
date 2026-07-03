import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./PageShell.css";

export default function PageShell() {
  return (
    <div className="page-shell">
      <Sidebar />
      <main className="page-shell__content">
        <div className="page-shell__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
