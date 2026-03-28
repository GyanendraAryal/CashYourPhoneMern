import { useEffect, useState } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { AdminStatsProvider } from "../context/AdminStatsContext";

export default function Shell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AdminStatsProvider>
    <div className="min-h-screen bg-surface-white-subtle text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-muted bg-white/90 backdrop-blur">
        <div className="flex h-16 w-full items-center gap-3 px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-muted bg-white text-text-primary shadow-sm hover:bg-surface-white-subtle focus:outline-none focus:ring-2 focus:ring-border-muted lg:hidden"
            aria-label="Open sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <Topbar />
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="flex w-full gap-4 px-3 py-4 sm:px-4 sm:py-6">
        {/* Desktop sidebar (single wrapper only) */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem-1.5rem)] w-64 shrink-0 overflow-y-auto rounded-2xl border border-border-muted bg-white shadow-sm lg:block">
          <Sidebar />
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-border-muted bg-white shadow-sm">
            <div className="p-4 sm:p-6">{children}</div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "" : "pointer-events-none"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          onClick={() => setSidebarOpen(false)}
          className={`absolute inset-0 bg-black/30 transition-opacity ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute left-0 top-0 h-full w-[18rem] max-w-[85vw] transform border-r border-border-muted bg-white shadow-xl transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-16 items-center justify-between border-b border-border-muted px-4">
            <span className="text-sm font-semibold tracking-tight text-text-primary">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-muted bg-white text-text-primary shadow-sm hover:bg-surface-white-subtle focus:outline-none focus:ring-2 focus:ring-border-muted"
              aria-label="Close sidebar"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            className="h-[calc(100vh-4rem)] overflow-y-auto p-3"
            onClick={() => setSidebarOpen(false)}
          >
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
    </AdminStatsProvider>
  );
}
