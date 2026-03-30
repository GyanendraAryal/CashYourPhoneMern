import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "/assets/logo.png";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

function getInitials(name = "") {
  const parts = String(name).trim().split(" ").filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function CartIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
}

const ease = [0.22, 1, 0.36, 1];

const dropdownVars = {
  initial: { opacity: 0, y: -8, scale: 0.98, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.2, ease } },
  exit: { opacity: 0, y: -6, scale: 0.98, filter: "blur(6px)", transition: { duration: 0.16, ease } },
};

const drawerVars = {
  initial: { x: "-100%" },
  animate: { x: 0, transition: { duration: 0.28, ease } },
  exit: { x: "-100%", transition: { duration: 0.22, ease } },
};

const overlayVars = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease } },
  exit: { opacity: 0, transition: { duration: 0.16, ease } },
};

function NavLinkItem({ to, isActive, children, onClick, className = "" }) {
  return (
    <Link to={to} onClick={onClick} className={`relative inline-flex ${className}`}>
      {isActive ? (
        <motion.span
          layoutId="active-pill"
          className="absolute inset-0 rounded-xl bg-primary-blue-active/90 shadow-none"
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}

      <motion.span
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={[
          "relative z-10 inline-flex items-center justify-center px-4 py-2 rounded-xl transition-all duration-200",
          isActive
            ? "text-white"
            : "text-text-primary hover:bg-primary-blue-muted/40 hover:text-text-primary",
        ].join(" ")}
      >
        {children}
      </motion.span>
    </Link>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const { pathname } = useLocation();
  const { count: cartCount, cartUnread, markCartRead } = useCart();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const profileRef = useRef(null);

  const isActive = (path) => pathname === path;
  const isBuyActive = pathname.startsWith("/buy");

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      toast.success("Logged out");
      navigate("/");
    } catch {
      toast.error("Logout failed");
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
      setProfileOpen(false);
      setMobileOpen(false);
    }
  };

  const initials = getInitials(user?.name);

  const dropItemBase =
    "block px-4 py-3 text-sm text-text-primary hover:bg-primary-blue-muted/40 transition-colors";
  const activeDrop = (path) =>
    pathname === path ? "bg-primary-blue-muted/40 font-semibold text-text-primary" : "";

  const CartLink = ({ className = "", onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef(null);
    const { cart } = useCart();

    if (!user) return null;

    const handleEnter = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsOpen(true);
      if (cartUnread) markCartRead(); // ✅ Clear notification on hover/view
    };

    const handleLeave = () => {
      timeoutRef.current = setTimeout(() => setIsOpen(false), 300);
    };

    return (
      <div 
        className="relative group"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <Link
          to="/cart"
          onClick={(e) => {
            markCartRead();
            onClick?.(e);
          }}
          className={`${className} relative inline-flex`}
        >
          {isActive("/cart") && (
            <motion.span
              layoutId="active-pill"
              className="absolute inset-0 rounded-xl bg-primary-blue-active/90 shadow-none"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
          )}

          <motion.span
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={[
              "relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200",
              isActive("/cart")
                ? "text-white"
                : "text-text-primary hover:bg-primary-blue-muted/40",
            ].join(" ")}
          >
            <CartIcon className="h-5 w-5" />
            <span>Cart</span>
          </motion.span>

          <AnimatePresence>
            {cartUnread && cartCount > 0 ? (
              <motion.span
                key="cart-badge"
                initial={{ scale: 0.6, opacity: 0, y: -4 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.6, opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease }}
                className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-secondary-violet-active text-white text-xs font-extrabold shadow-sm border border-white"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Link>

        {/* Desktop Cart Preview Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={dropdownVars}
              initial="initial"
              animate="animate"
              exit="exit"
              className="hidden md:block absolute right-0 mt-1 w-80 rounded-2xl border border-border-muted bg-white shadow-2xl overflow-hidden z-[60]"
            >
              <div className="p-4 border-b border-border-muted bg-primary-blue-muted/10">
                <h3 className="font-extrabold text-text-primary flex items-center justify-between">
                  <span>Your Cart</span>
                  <span className="text-xs font-bold text-text-muted bg-white/50 px-2 py-0.5 rounded-lg">
                    {cartCount} items
                  </span>
                </h3>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {cart?.items?.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-text-muted">Your cart is empty</p>
                  </div>
                ) : (
                  cart?.items?.map((it, idx) => (
                    <div key={idx} className="flex gap-3 p-2 rounded-xl hover:bg-surface-white-subtle transition-colors group/item">
                      <img 
                        src={it.thumbnailSnapshot} 
                        alt={it.nameSnapshot} 
                        className="w-12 h-12 rounded-lg object-cover border border-border-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate group-hover/item:text-primary-blue-active transition-colors">
                          {it.nameSnapshot}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {it.qty} × NPR {it.unitPriceSnapshot?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart?.items?.length > 0 && (
                <div className="p-4 bg-surface-white-subtle/50 border-t border-border-muted">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-text-muted">Subtotal</span>
                    <span className="font-extrabold text-primary-blue-active">
                      NPR {cart?.total || cart?.subtotal?.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/cart"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2.5 bg-white border border-border-muted rounded-xl text-xs font-extrabold text-center hover:bg-white/50 transition-colors"
                    >
                      View Cart
                    </Link>
                    <Link
                      to="/checkout"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2.5 bg-primary-blue-active text-white rounded-xl text-xs font-extrabold text-center hover:opacity-90 shadow-sm transition-all"
                    >
                      Checkout
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border-muted bg-white">
        <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-4">
            <motion.img
              src={logo}
              alt="CashYourPhone"
              className="h-10 sm:h-12 md:h-16 w-auto"
              whileHover={{ rotate: -2, scale: 1.02 }}
              transition={{ duration: 0.18, ease }}
            />
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-xl text-text-primary">
                CashYourPhone
              </span>
              <div className="flex gap-1 text-xs text-text-muted">
                <span>Buy</span>|<span>Sell</span>|<span>Exchange</span>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3 font-medium">
            <NavLinkItem to="/" isActive={isActive("/")}>Home</NavLinkItem>
            <NavLinkItem to="/buy" isActive={isBuyActive}>Buy</NavLinkItem>

            <CartLink />

            <NavLinkItem to="/sell" isActive={isActive("/sell")}>Sell / Exchange</NavLinkItem>
            <NavLinkItem to="/warranty" isActive={isActive("/warranty")}>Warranty</NavLinkItem>
            <NavLinkItem to="/contact" isActive={isActive("/contact")}>Contact</NavLinkItem>

            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl border border-primary-blue-active/70 text-primary-blue-active transition-colors duration-200 hover:bg-primary-blue-muted/40"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-primary-blue-active/90 text-white transition-colors duration-200 hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <div className="relative" ref={profileRef}>
                <motion.button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-border-muted px-3 py-2 transition-all duration-200 hover:bg-primary-blue-muted/30"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-blue-active/90 text-white flex items-center justify-center text-sm font-extrabold">
                    {initials}
                  </div>
                  <span className="font-semibold text-text-primary">Profile</span>
                  <motion.span
                    className="text-text-muted"
                    animate={{ rotate: profileOpen ? 180 : 0 }}
                    transition={{ duration: 0.18, ease }}
                  >
                    ▾
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {profileOpen ? (
                    <motion.div
                      key="profile-dd"
                      variants={dropdownVars}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-border-muted bg-white shadow-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border-muted bg-primary-blue-muted/20">
                        <div className="font-semibold text-text-primary">
                          {user?.name || "User"}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {user?.email || user?.phone || ""}
                        </div>
                      </div>

                      <Link
                        to="/account"
                        className={`${dropItemBase} ${activeDrop("/account")}`}
                        onClick={() => setProfileOpen(false)}
                      >
                        Dashboard
                      </Link>

                      <Link
                        to="/my-requests"
                        className={`${dropItemBase} ${activeDrop("/my-requests")}`}
                        onClick={() => setProfileOpen(false)}
                      >
                        My Requests
                      </Link>

                      <Link
                        to="/change-password"
                        className={`${dropItemBase} ${activeDrop("/change-password")}`}
                        onClick={() => setProfileOpen(false)}
                      >
                        Change Password
                      </Link>

                      <div className="border-t border-border-muted" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-primary-blue-active hover:bg-primary-blue-muted/30 transition-colors"
                      >
                        Log out
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}
          </div>

          <motion.button
            className="md:hidden rounded-xl px-3 py-1 text-2xl text-primary-blue-active border border-border-muted hover:bg-primary-blue-muted/30"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            whileTap={{ scale: 0.96 }}
          >
            ☰
          </motion.button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            key="drawer-wrap"
            className="fixed inset-0 z-50"
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div
              variants={overlayVars}
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              variants={drawerVars}
              className="relative w-72 max-w-[85vw] h-full bg-white p-5 shadow-2xl border-r border-border-muted"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="font-extrabold text-primary-blue-active">Menu</div>
                <motion.button
                  className="text-3xl rounded-xl px-3 py-1 hover:bg-primary-blue-muted/30"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  whileTap={{ scale: 0.96 }}
                >
                  ×
                </motion.button>
              </div>

              <div className="flex flex-col gap-3 text-lg font-medium">
                <Link to="/" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl hover:bg-primary-blue-muted/30">
                  Home
                </Link>
                <Link to="/buy" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl hover:bg-primary-blue-muted/30">
                  Buy
                </Link>

                <CartLink onClick={() => setMobileOpen(false)} />

                <Link to="/sell" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl hover:bg-primary-blue-muted/30">
                  Sell / Exchange
                </Link>
                <Link to="/warranty" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl hover:bg-primary-blue-muted/30">
                  Warranty
                </Link>
                <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl hover:bg-primary-blue-muted/30">
                  Contact
                </Link>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
    </>
  );
}
