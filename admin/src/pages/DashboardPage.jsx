import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import api from "../lib/api";
import { TrendingUp, DollarSign, Users, Smartphone, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../services/adminNotificationsService";

const StatCard = ({ title, value, icon: Icon, color = "blue", delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white border border-border-muted rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
        <Icon size={24} />
      </div>
      <div className="flex items-center text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
        <TrendingUp size={12} className="mr-1" /> +12%
      </div>
    </div>
    <div className="text-sm font-medium text-text-muted">{title}</div>
    <div className="text-3xl font-black text-text-primary mt-1">{value}</div>
  </motion.div>
);

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [analyticsRes, notifsRes] = await Promise.all([
        api.get("/api/admin/analytics/dashboard"),
        listAdminNotifications({ unreadOnly: true, limit: 10 })
      ]);

      setAnalytics(analyticsRes.data?.data);
      setNotifications(notifsRes?.items || []);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const kpis = useMemo(() => {
    if (!analytics) return [];
    const { overview } = analytics;
    return [
      { title: "Revenue (30d)", value: `Rs. ${overview.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: "green" },
      { title: "Active Users", value: overview.totalUsers, icon: Users, color: "blue" },
      { title: "Sell Requests", value: overview.totalSells, icon: TrendingUp, color: "purple" },
      { title: "Inventory", value: overview.totalDevices, icon: Smartphone, color: "orange" },
    ];
  }, [analytics]);

  const trends = analytics?.sellTrends || [];
  const maxTrend = Math.max(...trends.map(t => t.count), 1);

  return (
    <Shell>
      <div className="flex items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Executive Dashboard</h1>
          <p className="text-text-muted mt-1">Real-time intelligence and performance metrics.</p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-border-muted bg-white hover:bg-surface-white-subtle transition-colors shadow-sm"
        >
          <TrendingUp size={16} /> Refresh Intelligence
        </button>
      </div>

      {err ? (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
          {err}
        </div>
      ) : null}

      {!analytics && loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-white border border-border-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((k, i) => (
              <StatCard key={k.title} {...k} delay={i * 0.1} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Sell Trends Chart */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 bg-white border border-border-muted rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-500" /> Sell Request Volume (7d)
              </h3>
              <div className="h-48 flex items-end justify-between gap-2">
                {trends.map((t, i) => (
                  <div key={t._id} className="flex-1 flex flex-col items-center group">
                    <div className="w-full relative">
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(t.count / maxTrend) * 100}%` }}
                        className="bg-purple-100 group-hover:bg-purple-200 rounded-t-lg transition-colors border-t border-purple-200"
                        style={{ minHeight: '8px' }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.count}
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted mt-2 rotate-45 origin-left">{t._id.split("-").slice(1).join("/") || t._id}</span>
                  </div>
                ))}
                {trends.length === 0 && (
                   <div className="w-full h-full flex items-center justify-center text-text-muted text-sm italic">
                    No sell requests data for the last 7 days
                   </div>
                )}
              </div>
            </motion.div>

            {/* Fraud Alerts / Top Brands */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-border-muted rounded-2xl p-6 shadow-sm overflow-hidden"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" /> Intelligence Feed
              </h3>
              
              {analytics?.fraudAlerts?.length > 0 ? (
                <div className="space-y-4">
                  {analytics.fraudAlerts.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                      <div className="p-2 bg-white rounded-lg text-orange-600 shadow-sm">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold">Suspicious User Detected</span>
                        <p className="text-text-muted mt-0.5">{f.count} cancellations in 24h</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                   <div className="mx-auto w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
                      <TrendingUp size={24} />
                   </div>
                   <p className="text-sm font-medium text-text-primary">System Secure</p>
                   <p className="text-xs text-text-muted mt-1">No anomalous patterns detected.</p>
                </div>
              )}

              <hr className="my-6 border-border-muted" />

              <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4">Top Inventory Brands</h4>
              <div className="space-y-3">
                {analytics?.popularBrands?.map((b, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="text-sm font-medium">{b.brand}</div>
                      <div className="text-xs font-bold px-2 py-0.5 bg-surface-white-subtle rounded-full border">{b.count} models</div>
                   </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Notifications Section */}
      <div className="bg-white border border-border-muted rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-muted">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">Unread Alerts</h3>
            {notifications.length > 0 && (
              <span className="bg-primary-blue-active text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {notifications.length} NEW
              </span>
            )}
          </div>
          <button
            onClick={() => markAllAdminNotificationsRead().then(loadData)}
            className="text-xs font-bold text-primary-blue-active hover:underline disabled:opacity-50"
            disabled={notifications.length === 0}
          >
            Clear all notifications
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-sm text-text-muted">Analyzing notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface-white-subtle rounded-full flex items-center justify-center mb-4">
               <ArrowRight size={32} className="text-text-muted opacity-20" />
            </div>
            <p className="font-bold text-text-primary">Inbox Zero!</p>
            <p className="text-sm text-text-muted mt-1">All action items have been addressed.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-muted">
            {notifications.map((n) => (
              <li key={n._id} className="p-6 flex items-start justify-between gap-6 hover:bg-surface-white-subtle/30 transition-colors">
                <div className="flex gap-4">
                  <div className={`p-2.5 rounded-xl ${n.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text-primary">{n.message}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{n.type}</span>
                      <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                      <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => markAdminNotificationRead(n._id).then(loadData)}
                  className="shrink-0 p-2 rounded-lg border border-border-muted bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all text-text-muted"
                  title="Archive Notification"
                >
                  <ArrowRight size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
