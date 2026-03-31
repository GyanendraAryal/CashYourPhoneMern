import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import api from "../lib/api";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Smartphone, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCcw,
  Activity,
  Zap,
  ShieldCheck,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNPR, formatNumber } from "../lib/utils/currency";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../services/adminNotificationsService";

const StatCard = ({ title, value, icon: Icon, color = "blue", delay = 0, trend = "+12%" }) => {
  const colorMap = {
    green: "from-emerald-500 to-teal-600 shadow-emerald-200/50",
    blue: "from-blue-500 to-indigo-600 shadow-blue-200/50",
    purple: "from-purple-500 to-violet-600 shadow-purple-200/50",
    orange: "from-orange-400 to-red-500 shadow-orange-200/50",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, delay }}
      whileHover={{ y: -5 }}
      className="relative group overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
      
      <div className="relative bg-white border border-border-muted group-hover:border-transparent rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group-hover:shadow-2xl group-hover:bg-transparent transition-all duration-500 h-full">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl bg-${color}-50 group-hover:bg-white/20 text-${color}-600 group-hover:text-white transition-colors duration-500 shadow-sm`}>
            <Icon size={28} />
          </div>
          <div className="flex items-center text-green-500 group-hover:text-white text-xs font-black bg-green-50 group-hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors duration-500">
            <TrendingUp size={14} className="mr-1" /> {trend}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm font-bold text-text-muted group-hover:text-white/80 uppercase tracking-widest transition-colors duration-500">
            {title}
          </div>
          <div className="text-4xl font-black text-text-primary group-hover:text-white tracking-tighter transition-colors duration-500">
            {value}
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute -bottom-6 -right-6 text-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <Icon size={120} />
        </div>
      </div>
    </motion.div>
  );
};

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
      { title: "Revenue (30d)", value: formatNPR(overview.monthlyRevenue), icon: DollarSign, color: "green", trend: "+18.4%" },
      { title: "Active Users", value: formatNumber(overview.totalUsers), icon: Users, color: "blue", trend: "+5.2%" },
      { title: "Sell Requests", value: formatNumber(overview.totalSells), icon: Zap, color: "purple", trend: "+12.1%" },
      { title: "Inventory", value: formatNumber(overview.totalDevices), icon: Package, color: "orange", trend: "+3.8%" },
    ];
  }, [analytics]);

  const trends = analytics?.sellTrends || [];
  const maxTrend = Math.max(...trends.map(t => t.count), 1);

  return (
    <Shell>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-1 bg-primary-blue-active rounded-full" />
            <span className="text-xs font-black text-primary-blue-active uppercase tracking-[0.2em]">Platform Overview</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Executive Dashboard</h1>
          <p className="text-text-muted mt-2 text-lg">Real-time business intelligence for CashYourPhone (NPR).</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="hidden sm:flex flex-col items-end mr-4">
             <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Status</span>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-black uppercase text-text-primary">System Online</span>
             </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="group flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-black border-2 border-border-muted bg-white hover:bg-black hover:text-white transition-all duration-300 shadow-soft"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} /> 
            REFRESH INTELLIGENCE
          </button>
        </motion.div>
      </div>

      {err && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-l-4 border-red-500 text-red-600 px-6 py-4 rounded-xl mb-8 text-sm font-bold flex items-center gap-3 shadow-sm"
        >
          <AlertTriangle size={20} />
          {err}
        </motion.div>
      )}

      {loading && !analytics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-white border border-border-muted rounded-3xl animate-pulse ring-1 ring-border-muted" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {kpis.map((k, i) => (
              <StatCard key={k.title} {...k} delay={i * 0.1} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Sell Trends Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-8 bg-white border border-border-muted rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-text-primary tracking-tight">Sell Request Volume</h3>
                    <p className="text-xs text-text-muted mt-0.5">Historical activity over the last 7 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-white-subtle rounded-xl border border-border-muted text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-purple-500" /> Live Data
                </div>
              </div>

              <div className="h-64 flex items-end justify-between gap-4 md:gap-8 px-4">
                {trends.map((t, i) => (
                  <div key={t._id} className="flex-1 flex flex-col items-center group cursor-help">
                    <div className="w-full relative">
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(t.count / maxTrend) * 100}%` }}
                        transition={{ type: "spring", bounce: 0.3, delay: 0.5 + (i * 0.05) }}
                        className="bg-gradient-to-t from-purple-500 to-indigo-400 group-hover:from-purple-600 group-hover:to-indigo-500 rounded-2xl transition-all duration-300 shadow-lg shadow-purple-200"
                        style={{ minHeight: '12px' }}
                      />
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 shadow-xl font-bold">
                        {t.count} Requests
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-text-muted mt-4 group-hover:text-purple-600 transition-colors uppercase tracking-widest">
                      {t._id.split("-").slice(1).join("/") || t._id}
                    </span>
                  </div>
                ))}
                {trends.length === 0 && (
                   <div className="w-full h-full flex flex-col items-center justify-center text-text-muted text-sm italic py-12 gap-4">
                      <div className="p-4 bg-surface-white-subtle rounded-full opacity-20">
                         <Activity size={48} />
                      </div>
                      No sell requests data for the specific window
                   </div>
                )}
              </div>
            </motion.div>

            {/* Intelligence Feed */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-4 bg-text-primary rounded-[2rem] p-10 shadow-2xl text-white overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              
              <h3 className="font-black text-xl mb-10 flex items-center gap-3 relative z-10 tracking-tight">
                <ShieldCheck size={24} className="text-green-400" /> Intelligence Feed
              </h3>
              
              <div className="relative z-10 space-y-6">
                {analytics?.fraudAlerts?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.fraudAlerts.map((f, i) => (
                      <div key={i} className="flex items-center gap-4 p-5 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl">
                        <div className="p-3 bg-red-400/20 text-red-300 rounded-xl">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <span className="text-sm font-bold block mb-0.5">Suspicious User Detected</span>
                          <p className="text-white/60 text-xs">{f.count} cancellations in 24h cycle</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/5 text-center">
                    <div className="mx-auto w-16 h-16 bg-green-400/20 text-green-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <ShieldCheck size={32} />
                    </div>
                    <p className="text-lg font-black tracking-tight">Systems Secure</p>
                    <p className="text-xs text-white/50 mt-2 leading-relaxed">No anomalous behavior detected across 1,000+ data nodes.</p>
                  </div>
                )}

                <div className="mt-12">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6">Market Dominance</h4>
                  <div className="space-y-4">
                    {analytics?.popularBrands?.map((b, i) => (
                      <div key={i} className="group flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:scale-150 transition-transform" />
                            <span className="text-sm font-bold tracking-tight">{b.brand}</span>
                          </div>
                          <span className="text-[10px] font-black px-3 py-1 bg-white/10 rounded-lg group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-all">{b.count} models</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Notifications Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white border border-border-muted rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.02)] mb-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-10 py-8 border-b border-border-muted bg-surface-white-subtle/30">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
               <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl tracking-tight text-text-primary">System Alerts</h3>
              <p className="text-xs text-text-muted mt-0.5">Critical operations requiring executive review</p>
            </div>
            {notifications.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-red-200">
                {notifications.length} NEW
              </span>
            )}
          </div>
          <button
            onClick={() => markAllAdminNotificationsRead().then(loadData)}
            className="flex items-center gap-2 text-xs font-black text-primary-blue-active tracking-widest hover:text-black transition-colors disabled:opacity-50 uppercase"
            disabled={notifications.length === 0}
          >
            Acknowledge all <ArrowRight size={14} />
          </button>
        </div>

        <div className="min-h-[300px]">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-sm text-text-muted gap-4">
               <RefreshCcw size={32} className="animate-spin text-primary-blue-active" />
               Analyzing notification stack…
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-24 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-green-50/50">
                 <ShieldCheck size={48} />
              </div>
              <p className="text-2xl font-black text-text-primary tracking-tight">Platform Synchronized</p>
              <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">Inbox zero achieved. All critical operation paths are currently clear.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-muted p-4">
              <AnimatePresence>
                {notifications.map((n, i) => (
                  <motion.li 
                    key={n._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-8 flex items-start justify-between gap-8 hover:bg-surface-white-subtle/50 transition-all duration-300 rounded-2xl group"
                  >
                    <div className="flex gap-6">
                      <div className={`p-4 rounded-2xl shrink-0 shadow-sm ${n.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Zap size={22} />
                      </div>
                      <div className="pt-1">
                        <div className="text-lg font-bold text-text-primary leading-tight group-hover:text-primary-blue-active transition-colors">{n.message}</div>
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${n.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {n.type}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-text-muted/20" />
                          <span className="text-[10px] text-text-muted uppercase tracking-widest font-black italic">
                            Detected {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => markAdminNotificationRead(n._id).then(loadData)}
                      className="shrink-0 p-4 rounded-2xl border-2 border-border-muted bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300 text-text-muted opacity-0 group-hover:opacity-100 shadow-sm translate-x-4 group-hover:translate-x-0"
                      title="Mark as Actioned"
                    >
                      <ShieldCheck size={20} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </motion.div>
    </Shell>
  );
}
