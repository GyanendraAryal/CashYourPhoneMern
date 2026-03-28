import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import { useAdminStats } from "../context/AdminStatsContext";
import { adminListUsers } from "../services/adminUsersService";

export default function UsersPage() {
  const { markByTypeRead } = useAdminStats();

  useEffect(() => {
    markByTypeRead("NEW_USER");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const totalPages = useMemo(() => data?.totalPages || 1, [data]);

  async function load({ qNext = q, pageNext = page } = {}) {
    setLoading(true);
    setErr("");
    try {
      const res = await adminListUsers({
        q: String(qNext || "").trim(),
        page: pageNext,
        limit,
      });
      setData(res);
    } catch (e) {
      setErr(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load({ qNext: q, pageNext: page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function onSearch(e) {
    e.preventDefault();
    setPage(1);
    load({ qNext: q, pageNext: 1 });
  }

  const items = data?.items || [];

  return (
    <Shell>
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-sm text-text-muted">
              Admin-only user directory (safe fields only).
            </p>
          </div>

          <form onSubmit={onSearch} className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full md:w-80 border rounded-lg px-3 py-2"
              placeholder="Search name / email / phone"
            />
            <button
              type="submit"
              className="rounded-lg px-4 py-2 bg-black text-white disabled:opacity-60"
              disabled={loading}
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-4">
          {err ? (
            <div className="border rounded-lg p-3 text-primary-blue-active bg-primary-blue-muted">
              {err}
            </div>
          ) : null}

          <div className="mt-3 border rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-white-subtle text-text-primary">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Phone</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Role</th>
                    <th className="text-left px-3 py-2">Verified</th>
                    <th className="text-left px-3 py-2">Created</th>
                    <th className="text-right px-3 py-2">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-3 py-3 text-text-muted" colSpan={7}>
                        Loading...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-text-muted" colSpan={7}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    items.map((u) => (
                      <tr key={u.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{u.name}</td>
                        <td className="px-3 py-2">{u.phone || "-"}</td>
                        <td className="px-3 py-2">{u.email || "-"}</td>
                        <td className="px-3 py-2">{u.role}</td>
                        <td className="px-3 py-2">
                          {u.isVerified ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-success-green-muted text-success-green-dark">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-surface-white-subtle text-text-primary">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            to={`/users/${u.id}`}
                            className="inline-flex rounded-lg px-3 py-1.5 border hover:bg-surface-white-subtle"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-3 py-2 border-t bg-surface-white-subtle">
              <div className="text-xs text-text-muted">
                Page {data?.page || page} of {totalPages} • Total {data?.total || 0}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border disabled:opacity-50"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border disabled:opacity-50"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
