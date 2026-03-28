import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { adminGetUser } from "../services/adminUsersService";

export default function UserDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await adminGetUser(id);
        if (alive) setData(res);
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load user");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const user = data?.user;
  const orders = data?.orders;

  return (
    <Shell>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
              <Link to="/users" className="hover:text-text-primary hover:underline">
                Users
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">User Detail</span>
              {user?.role ? (
                <span className="ml-1 inline-flex items-center rounded-full bg-surface-white-subtle px-2.5 py-1 text-xs font-semibold text-text-primary">
                  {user.role}
                </span>
              ) : null}
              {user?.isVerified ? (
                <span className="inline-flex items-center rounded-full bg-success-green-muted px-2.5 py-1 text-xs font-semibold text-success-green-dark">
                  Verified
                </span>
              ) : (
                user ? (
                  <span className="inline-flex items-center rounded-full bg-primary-blue-muted px-2.5 py-1 text-xs font-semibold text-primary-blue-active">
                    Not verified
                  </span>
                ) : null
              )}
            </div>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
              {user?.name || "User Detail"}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Review profile, account signals, and recent purchases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/users"
              className="inline-flex items-center justify-center rounded-xl border border-border-muted bg-white px-3.5 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-white-subtle focus:outline-none focus:ring-2 focus:ring-border-muted"
            >
              Back
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {err ? (
          <div className="mt-4 rounded-2xl border border-primary-blue-muted bg-primary-blue-muted p-4 text-primary-blue-active">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-blue-muted">
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
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  </svg>
                </span>
              </div>
              <div className="min-w-0">
                <div className="font-semibold">Couldn’t load user</div>
                <div className="mt-0.5 text-sm text-primary-blue-active break-words">
                  {err}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 rounded-2xl border border-border-muted bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-white-subtle" />
              <div className="flex-1">
                <div className="h-4 w-40 animate-pulse rounded bg-surface-white-subtle" />
                <div className="mt-2 h-3 w-64 animate-pulse rounded bg-surface-white-subtle" />
              </div>
            </div>
          </div>
        ) : null}

        {!loading && user ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {/* Left: Profile */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-text-primary">
                    Profile
                  </h2>

                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-white-subtle text-sm font-bold text-text-primary">
                    {(user?.name || user?.email || "U")
                      .trim()
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <Field
                    label="Name"
                    value={user.name || "-"}
                    emphasize
                  />
                  <Field
                    label="Phone"
                    value={user.phone || "-"}
                    mono
                  />
                  <Field
                    label="Email"
                    value={user.email || "-"}
                    mono
                  />
                  <Field
                    label="Role"
                    value={
                      user.role ? (
                        <span className="inline-flex items-center rounded-full bg-surface-white-subtle px-2.5 py-1 text-xs font-semibold text-text-primary">
                          {user.role}
                        </span>
                      ) : (
                        "-"
                      )
                    }
                  />
                  <Field
                    label="Verified"
                    value={
                      user.isVerified ? (
                        <span className="inline-flex items-center rounded-full bg-success-green-muted px-2.5 py-1 text-xs font-semibold text-success-green-dark">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-primary-blue-muted px-2.5 py-1 text-xs font-semibold text-primary-blue-active">
                          No
                        </span>
                      )
                    }
                  />

                  <div className="mt-4 rounded-xl bg-surface-white-subtle p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs font-medium text-text-muted">
                          Created
                        </div>
                        <div className="mt-1 font-medium text-text-primary">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-text-muted">
                          Updated
                        </div>
                        <div className="mt-1 font-medium text-text-primary">
                          {user.updatedAt
                            ? new Date(user.updatedAt).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="pt-2 text-xs text-text-muted">
                    Sensitive auth fields are excluded (passwordHash, refreshTokens).
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Orders */}
            <div className="lg:col-span-2">
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Orders"
                  value={orders?.count ?? 0}
                  icon={
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
                      <path d="M9 17h6" />
                      <path d="M9 13h6" />
                      <path d="M5 3h14a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z" />
                    </svg>
                  }
                />
                <Stat
                  label="Last order"
                  value={
                    orders?.lastOrderAt
                      ? new Date(orders.lastOrderAt).toLocaleDateString()
                      : "-"
                  }
                  icon={
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
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  }
                />
                <Stat
                  label="Total spent"
                  value={
                    typeof orders?.totalSpent === "number"
                      ? orders.totalSpent
                      : 0
                  }
                  icon={
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
                      <path d="M12 1v22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  }
                />
              </div>

              {/* Recent orders table */}
              <div className="mt-5 rounded-2xl border border-border-muted bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border-muted px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-text-primary">
                      Recent Orders
                    </h2>
                    <p className="mt-0.5 text-sm text-text-muted">
                      Latest purchases placed by this user.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-surface-white-subtle text-text-primary">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">
                          Order
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">
                          Total
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">
                          Payment
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">
                          Created
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {(orders?.recent || []).length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-text-muted" colSpan={5}>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-surface-white-subtle" />
                              <div>
                                <div className="font-semibold text-text-primary">
                                  No orders yet
                                </div>
                                <div className="text-sm text-text-muted">
                                  This user hasn’t placed any orders.
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        orders.recent.map((o) => (
                          <tr
                            key={o.id}
                            className="hover:bg-surface-white-subtle/60 transition"
                          >
                            <td className="px-4 py-3 font-semibold text-text-primary">
                              {o.orderNumber}
                            </td>
                            <td className="px-4 py-3 text-text-primary">
                              {o.total}
                            </td>
                            <td className="px-4 py-3">
                              <Pill tone="neutral" value={o.status} />
                            </td>
                            <td className="px-4 py-3">
                              <Pill
                                tone={
                                  String(o.paymentStatus || "")
                                    .toLowerCase()
                                    .includes("paid")
                                    ? "good"
                                    : "warn"
                                }
                                value={o.paymentStatus}
                              />
                            </td>
                            <td className="px-4 py-3 text-text-primary">
                              {o.createdAt
                                ? new Date(o.createdAt).toLocaleString()
                                : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-border-muted px-5 py-3">
                  <p className="text-xs text-text-muted">
                    Tip: Use this page to verify user identity and purchase
                    behavior quickly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function Field({ label, value, emphasize, mono }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-sm text-text-muted">{label}</div>
      <div
        className={[
          "text-right text-sm font-medium text-text-primary break-all",
          emphasize ? "text-base font-semibold" : "",
          mono ? "font-mono text-[13px]" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-border-muted bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-text-muted">{label}</div>
          <div className="mt-1 text-xl font-bold tracking-tight text-text-primary">
            {value}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-white-subtle text-text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Pill({ value, tone = "neutral" }) {
  const t = String(tone || "neutral");
  const cls =
    t === "good"
      ? "bg-success-green-muted text-success-green-dark"
      : t === "warn"
      ? "bg-primary-blue-muted text-primary-blue-active"
      : "bg-surface-white-subtle text-text-primary";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {value || "-"}
    </span>
  );
}
