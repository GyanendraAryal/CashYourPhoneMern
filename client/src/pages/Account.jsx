import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import api from "../lib/api";

function normalizeStatus(status) {
  return String(status || "new").toLowerCase();
}

function badgeClass(status) {
  const s = normalizeStatus(status);
  if (s === "closed") return "bg-green-600 text-white";
  if (s === "contacted") return "bg-primary-blue-active text-white";
  return "bg-secondary-violet-active text-black";
}

function StatCard({ title, value, hint }) {
  return (
    <div className="rounded-2xl border border-border-muted bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-medium text-text-muted">{title}</div>
          {hint ? <div className="mt-1 text-sm text-text-muted">{hint}</div> : null}
        </div>

        <div className="rounded-2xl bg-surface-white-subtle px-4 py-2 text-3xl font-bold text-text-primary ring-1 ring-border-muted">
          {value}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0 flex-1">
        <div className="h-5 w-60 max-w-[75%] animate-pulse rounded bg-surface-white-subtle" />
        <div className="mt-3 h-4 w-44 max-w-[55%] animate-pulse rounded bg-surface-white-subtle" />
      </div>
      <div className="h-8 w-24 animate-pulse rounded-full bg-surface-white-subtle" />
    </div>
  );
}

function formatWhen(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchMyRequests() {
      try {
        setLoading(true);

        const res = await api.get("/api/v1/sell-requests/my", {
          params: { sort: "-createdAt", limit: 50 },
        });

        const items = res?.data?.items || res?.data || [];
        if (mounted) setRequests(items);
      } catch (err) {
        toast.error("Failed to load your requests");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMyRequests();
    return () => {
      mounted = false;
    };
  }, []);

  const { stats, recent } = useMemo(() => {
    const out = { total: 0, newCount: 0, contacted: 0, closed: 0 };
    out.total = requests.length;

    for (const r of requests) {
      const s = normalizeStatus(r.status);
      if (s === "new") out.newCount += 1;
      else if (s === "contacted") out.contacted += 1;
      else if (s === "closed") out.closed += 1;
    }

    return { stats: out, recent: requests.slice(0, 5) };
  }, [requests]);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed. Please try again.");
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  const displayName = user?.name || "there";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface-white-subtle/60">
      <div className="container mx-auto px-4 py-10 md:px-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-border-muted bg-white px-4 py-2 text-sm font-medium text-text-primary shadow-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                Account Dashboard
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">
                Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-base text-text-muted">
                Hi <span className="font-medium text-text-primary">{displayName}</span> — track your sell
                requests and manage actions.
              </p>
            </div>

            {/* Desktop logout */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogoutClick}
                className="hidden sm:inline-flex items-center justify-center rounded-2xl border border-border-muted bg-white px-5 py-3 text-base font-medium text-text-primary shadow-sm hover:bg-surface-white-subtle active:scale-[0.99]"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="New" value={stats.newCount} hint="Waiting for review" />
            <StatCard title="Contacted" value={stats.contacted} hint="We reached you" />
            <StatCard title="Closed" value={stats.closed} hint="Completed" />
            <StatCard title="Total" value={stats.total} hint="All requests" />
          </div>

          {/* Main grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Requests */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border-muted bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-border-muted px-6 py-5">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">Recent Requests</h2>
                    <p className="mt-1 text-base text-text-muted">
                      Your latest activity appears here.
                    </p>
                  </div>

                  <Link
                    to="/my-requests"
                    className="inline-flex items-center justify-center rounded-2xl border border-border-muted bg-white px-4 py-2.5 text-base font-medium text-primary-blue-active shadow-sm hover:bg-surface-white-subtle"
                  >
                    View all
                  </Link>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="divide-y divide-border-muted">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                ) : recent.length === 0 ? (
                  <div className="px-6 py-10">
                    <div className="rounded-2xl border border-dashed border-border-muted bg-surface-white-subtle px-7 py-9">
                      <div className="text-lg font-semibold text-text-primary">No requests yet</div>
                      <div className="mt-2 text-base text-text-muted">
                        Submit your first sell/exchange request to start tracking it here.
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                          to="/sell"
                          className="inline-flex items-center justify-center rounded-2xl bg-primary-blue-active px-6 py-3 text-base font-medium text-white shadow-sm hover:opacity-95 active:scale-[0.99]"
                        >
                          Submit a Sell / Exchange Request
                        </Link>

                        <Link
                          to="/buy"
                          className="inline-flex items-center justify-center rounded-2xl border border-border-muted bg-white px-6 py-3 text-base font-medium text-text-primary shadow-sm hover:bg-surface-white-subtle"
                        >
                          Browse phones
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border-muted">
                    {recent.map((r) => {
                      const title = r.deviceName || r.model || r.brand || "Sell Request";
                      const when = formatWhen(r.createdAt);
                      const shortId = r._id ? String(r._id).slice(-6) : "";

                      return (
                        <div
                          key={r._id || r.id}
                          className="flex items-center justify-between gap-4 px-6 py-5 hover:bg-surface-white-subtle"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-base font-medium text-text-primary">
                              {title}
                            </div>

                            <div className="mt-1 text-sm text-text-muted">
                              {when ? <span>{when}</span> : null}
                              {when && shortId ? <span className="mx-2">•</span> : null}
                              {shortId ? <span>ID: {shortId}</span> : null}
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${badgeClass(
                              r.status
                            )}`}
                          >
                            {normalizeStatus(r.status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mobile logout */}
                <div className="border-t border-border-muted px-6 py-5 sm:hidden">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full rounded-2xl border border-border-muted bg-white px-5 py-3 text-base font-medium text-text-primary shadow-sm hover:bg-surface-white-subtle active:scale-[0.99]"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border-muted bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-text-primary">Quick Actions</h2>
              <p className="mt-2 text-base text-text-muted">Jump back into what you want to do next.</p>

              <div className="mt-6 grid gap-3">
                <Link
                  to="/sell"
                  className="group rounded-2xl border border-border-muted bg-white p-5 shadow-sm hover:bg-surface-white-subtle"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-medium text-text-primary">Sell / Exchange</div>
                      <div className="mt-1 text-sm text-text-muted">Submit a new phone request.</div>
                    </div>
                    <span className="mt-0.5 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                      New
                    </span>
                  </div>
                </Link>

                <Link
                  to="/my-requests"
                  className="group rounded-2xl border border-border-muted bg-white p-5 shadow-sm hover:bg-surface-white-subtle"
                >
                  <div className="text-base font-medium text-text-primary">Track Requests</div>
                  <div className="mt-1 text-sm text-text-muted">Check status and updates.</div>
                </Link>

                <Link
                  to="/contact"
                  className="group rounded-2xl border border-border-muted bg-white p-5 shadow-sm hover:bg-surface-white-subtle"
                >
                  <div className="text-base font-medium text-text-primary">Contact Support</div>
                  <div className="mt-1 text-sm text-text-muted">Ask questions or get help.</div>
                </Link>

                <Link
                  to="/faq"
                  className="group rounded-2xl border border-border-muted bg-white p-5 shadow-sm hover:bg-surface-white-subtle"
                >
                  <div className="text-base font-medium text-text-primary">FAQs</div>
                  <div className="mt-1 text-sm text-text-muted">Find answers quickly.</div>
                </Link>

                <Link
                  to="/change-password"
                  className="group rounded-2xl border border-border-muted bg-white p-5 shadow-sm hover:bg-surface-white-subtle"
                >
                  <div className="text-base font-medium text-text-primary">Change Password</div>
                  <div className="mt-1 text-sm text-text-muted">Update your account password.</div>
                </Link>
              </div>

              <div className="mt-6 rounded-2xl border border-border-muted bg-surface-white-subtle p-5">
                <div className="text-base font-semibold text-text-primary">Tip</div>
                <div className="mt-2 text-sm text-text-muted">
                  If your request is pending, we usually respond within 24–48 hours.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout confirm modal */}
        <ConfirmModal
          open={showLogoutModal}
          title="Log out?"
          message="Are you sure you want to log out of your account?"
          confirmText="Log out"
          cancelText="Cancel"
          variant="danger"
          loading={logoutLoading}
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
        />
      </div>
    </div>
  );
}
