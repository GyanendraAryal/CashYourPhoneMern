import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { clearToken, setAuthed } from "../lib/auth";
import api from "../lib/api";
import ConfirmModal from "./ConfirmModal";

// ✅ add this import (adjust path if your folder differs)
import logo from "../assets/logo.png";

export default function Topbar() {
  const nav = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const openLogout = () => setShowLogoutModal(true);
  const closeLogout = () => setShowLogoutModal(false);

  const confirmLogout = async () => {
    try {
      setLoading(true);

      try {
        await api.post("/api/admin/auth/logout");
      } catch (_) {
        // ignore API failure, still logout locally
      }

      clearToken();
      setAuthed(false);

      toast.success("Logged out");
      nav("/login", { replace: true });
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      {/* Content-only Topbar (Shell provides height/border/background/padding) */}
      <div className="flex w-full items-center justify-between">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          {/* Logo */}
          <img
            src={logo}
            alt="CashYourPhone"
            className="h-12 w-12 shrink-0 rounded-md object-contain"
          />

          {/* Title */}
          <span className="truncate text-base font-semibold tracking-tight text-text-primary">
            CashYourPhone 
          </span>
          
        </Link>
        

        <button
          onClick={openLogout}
          className="inline-flex items-center justify-center rounded-lg border border-border-muted bg-white px-3 py-1.5 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-white-subtle focus:outline-none focus:ring-2 focus:ring-border-muted"
        >
          Logout
        </button>
      </div>

      {/* Logout confirmation modal */}
      <ConfirmModal
        open={showLogoutModal}
        title="Log out?"
        message="Are you sure you want to log out of the admin panel?"
        confirmText="Log out"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
        onCancel={closeLogout}
        onConfirm={confirmLogout}
      />
    </>
  );
}
