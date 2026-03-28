import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

function normalizeStatus(status) {
  // Backend enum: new | contacted | closed
  return String(status || "new").toLowerCase();
}

function badgeClass(status) {
  const s = normalizeStatus(status);
  if (s === "closed")
    return "bg-success-green-muted text-success-green-dark ring-1 ring-success-green-muted";
  if (s === "contacted")
    return "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted";
  return "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted"; // new/default
}

function StatPill({ label, value }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border-muted bg-white px-3 py-1.5 text-xs font-semibold text-text-primary shadow-sm">
      <span className="text-text-muted">{label}</span>
      <span className="rounded-full bg-surface-white-subtle px-2 py-0.5 text-text-primary ring-1 ring-border-muted">
        {value}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-56 max-w-[70%] animate-pulse rounded bg-surface-white-subtle" />
          <div className="mt-2 h-3 w-40 max-w-[55%] animate-pulse rounded bg-surface-white-subtle" />
        </div>
        <div className="h-7 w-20 animate-pulse rounded-full bg-surface-white-subtle" />
      </div>
      <div className="mt-4 h-3 w-44 animate-pulse rounded bg-surface-white-subtle" />
      <div className="mt-2 h-3 w-36 animate-pulse rounded bg-surface-white-subtle" />
    </div>
  );
}

export default function MyRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError("");
      setLoading(true);
      try {
        const res = await api.get("/api/v1/sell-requests/my", {
          params: {
            status: status || undefined,
            sort: "-createdAt",
          },
        });
        if (!mounted) return;
        setItems(res.data?.items || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || "Failed to load your requests");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [status]);

  const counts = useMemo(() => {
    const total = items.length;
    const newCount = items.filter((r) => normalizeStatus(r.status) === "new")
      .length;
    const contacted = items.filter(
      (r) => normalizeStatus(r.status) === "contacted"
    ).length;
    const closed = items.filter((r) => normalizeStatus(r.status) === "closed")
      .length;
    return { total, newCount, contacted, closed };
  }, [items]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface-white-subtle/60">
      <div className="container mx-auto px-4 py-10 md:px-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
                  My Requests
                </h1>
                <p className="mt-2 text-sm text-text-muted md:text-base">
                  Track your sell/exchange requests and their current status.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatPill label="Total" value={counts.total} />
                  <StatPill label="New" value={counts.newCount} />
                  <StatPill label="Contacted" value={counts.contacted} />
                  <StatPill label="Closed" value={counts.closed} />
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-3 sm:justify-end">
                <div className="text-xs font-semibold text-text-muted">Filter</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-40 rounded-xl border border-border-muted bg-white px-3 py-2 text-sm font-semibold text-text-primary shadow-sm outline-none hover:bg-surface-white-subtle focus:ring-2 focus:ring-border-muted"
                >
                  <option value="">All</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* States */}
          {error ? (
            <div className="mt-6 rounded-2xl border border-primary-blue-muted bg-primary-blue-muted p-5 text-primary-blue-active shadow-sm">
              <div className="font-semibold">Couldn’t load requests</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          ) : null}

          {/* List */}
          <div className="mt-6 grid gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : !error && items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-muted bg-white p-8 text-center shadow-sm">
                <div className="text-lg font-bold text-text-primary">
                  No requests yet
                </div>
                <div className="mt-2 text-sm text-text-muted">
                  When you submit a request, it will appear here with its status.
                </div>

                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    to="/sell"
                    className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-dark)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.99]"
                  >
                    Submit a request
                  </Link>
                  <Link
                    to="/account"
                    className="inline-flex items-center justify-center rounded-xl border border-border-muted bg-white px-5 py-2.5 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-white-subtle"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>
            ) : (
              items.map((it) => (
                <div
                  key={it._id}
                  className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-base font-bold text-text-primary">
                          {it.deviceName || "Sell Request"}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                            it.status
                          )}`}
                        >
                          {normalizeStatus(it.status)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-surface-white-subtle px-3 py-1 text-text-primary ring-1 ring-border-muted">
                          Condition:{" "}
                          <span className="font-semibold text-text-primary">
                            {it.deviceCondition || "N/A"}
                          </span>
                        </span>

                        <span className="rounded-full bg-surface-white-subtle px-3 py-1 text-text-primary ring-1 ring-border-muted">
                          Expected:{" "}
                          <span className="font-semibold text-text-primary">
                            {it.expectedPrice || 0}
                          </span>
                        </span>

                        {it._id ? (
                          <span className="rounded-full bg-surface-white-subtle px-3 py-1 text-text-primary ring-1 ring-border-muted">
                            ID:{" "}
                            <span className="font-semibold text-text-primary">
                              {String(it._id).slice(-6)}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      Created:{" "}
                      <span className="text-text-primary">
                        {it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
