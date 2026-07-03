import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import PageShell from "./components/layout/PageShell";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "react-hot-toast";
import "./App.css";

function MainApp() {
  return <AppRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--color-bg-secondary)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-strong)",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
