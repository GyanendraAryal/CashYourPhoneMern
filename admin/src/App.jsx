import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./lib/api";
import { isAuthed, setAuthed } from "./lib/auth";
import { AdminStatsProvider } from "./context/AdminStatsContext";

import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HeroSlidesPage from "./pages/HeroSlidesPage.jsx";
import DevicesPage from "./pages/DevicesPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";
import SellRequestsPage from "./pages/SellRequestsPage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import FaqsPage from "./pages/FaqsPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import UserDetailPage from "./pages/UserDetailPage.jsx";
import NotFound from "./pages/NotFound.jsx";

function Protected({ children }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(isAuthed());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.get("/api/admin/auth/me");
        if (!mounted) return;
        setAuthed(true);
        setOk(true);
      } catch (_) {
        if (!mounted) return;
        setAuthed(false);
        setOk(false);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-sm text-text-muted">Checking session…</div>
      </div>
    );
  }
  return ok ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AdminStatsProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/hero-slides" element={<Protected><HeroSlidesPage /></Protected>} />
        <Route path="/devices" element={<Protected><DevicesPage /></Protected>} />
        <Route path="/reviews" element={<Protected><ReviewsPage /></Protected>} />
        <Route path="/sell-requests" element={<Protected><SellRequestsPage /></Protected>} />
        <Route path="/pricing" element={<Protected><PricingPage /></Protected>} />
        <Route path="/faqs" element={<Protected><FaqsPage /></Protected>} />
        <Route path="/orders" element={<Protected><OrdersPage /></Protected>} />
        <Route path="/users" element={<Protected><UsersPage /></Protected>} />
        <Route path="/users/:id" element={<Protected><UserDetailPage /></Protected>} />

        <Route path="*" element={<Protected><NotFound /></Protected>} />
      </Routes>
    </AdminStatsProvider>
  );
}
