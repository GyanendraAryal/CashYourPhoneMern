import { NavLink } from "react-router-dom";
import { useAdminStats } from "../context/AdminStatsContext";
import {
  LayoutDashboard,
  Images,
  Smartphone,
  Star,
  ArrowUpDown,
  HelpCircle,
  Cpu,
  Users,
  Receipt,
} from "lucide-react";

const Item = ({ to, icon: Icon, badgeCount = 0, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-border-muted",
        isActive
          ? "bg-primary-blue-active text-white shadow-sm"
          : "text-text-primary hover:bg-surface-white-subtle",
      ].join(" ")
    }
  >
    <Icon size={18} className="shrink-0" />
    <span className="flex-1">{children}</span>
    {badgeCount > 0 ? (
      <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
        {badgeCount > 99 ? "99+" : badgeCount}
      </span>
    ) : null}
  </NavLink>
);

export default function Sidebar() {
  const { stats } = useAdminStats();
  return (
    <nav className="w-full">
      <div className="space-y-1 p-2">
        <Item to="/" icon={LayoutDashboard}>Dashboard</Item>
        <Item to="/hero-slides" icon={Images}>Hero Slides</Item>
        <Item to="/devices" icon={Smartphone}>Devices</Item>
        <Item to="/reviews" icon={Star} badgeCount={stats?.pendingReviews || 0}>Reviews</Item>
        <Item to="/sell-requests" icon={ArrowUpDown} badgeCount={stats?.unreadNewSellRequests || 0}>Sell Requests</Item>
        <Item to="/pricing" icon={Cpu}>Pricing Engine</Item>
        <Item to="/orders" icon={Receipt} badgeCount={stats?.unreadNewOrders || 0}>Orders</Item>
        <Item to="/users" icon={Users} badgeCount={stats?.unreadNewUsers || 0}>Users</Item>
        <Item to="/faqs" icon={HelpCircle}>FAQs</Item>
      </div>
    </nav>
  );
}
