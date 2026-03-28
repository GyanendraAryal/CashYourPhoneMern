import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AdminStatsContext = createContext(null);

export function AdminStatsProvider({ children }) {
  const [stats, setStats] = useState({
    devices: 0,
    heroSlides: 0,
    reviews: 0,
    pendingReviews: 0,
    sellRequests: 0,
    users: 0,
    orders: 0,
    unreadNotifications: 0,
    unreadNewUsers: 0,
    unreadNewOrders: 0,
    unreadNewSellRequests: 0,
    unreadNewReviews: 0,
  });

  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/stats");
      setStats((prev) => ({
        ...prev,
        devices: data?.devices ?? 0,
        heroSlides: data?.heroSlides ?? 0,
        reviews: data?.reviews ?? 0,
        pendingReviews: data?.pendingReviews ?? 0,
        sellRequests: data?.sellRequests ?? 0,
        users: data?.users ?? 0,
        orders: data?.orders ?? 0,
        unreadNotifications: data?.unreadNotifications ?? 0,
        unreadNewUsers: data?.unreadNewUsers ?? 0,
        unreadNewOrders: data?.unreadNewOrders ?? 0,
        unreadNewSellRequests: data?.unreadNewSellRequests ?? 0,
        unreadNewReviews: data?.unreadNewReviews ?? 0,
      }));
    } catch {
      // Sidebar badges should never block navigation
    } finally {
      setLoading(false);
    }
  }, []);

  const markByTypeRead = useCallback(
    async (type) => {
      if (!type) return;
      try {
        await api.post("/api/admin/notifications/read-by-type", { type });
      } catch {
        // ignore
      } finally {
        refresh();
      }
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ stats, refresh, markByTypeRead, loading }), [stats, refresh, markByTypeRead, loading]);

  return <AdminStatsContext.Provider value={value}>{children}</AdminStatsContext.Provider>;
}

export function useAdminStats() {
  const ctx = useContext(AdminStatsContext);
  if (!ctx) throw new Error("useAdminStats must be used within AdminStatsProvider");
  return ctx;
}
