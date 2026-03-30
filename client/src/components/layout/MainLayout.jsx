import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";
import ScrollToTop from "../ScrollToTop";

export default function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className={isHome ? "" : "container mx-auto px-4 md:px-8"}>
          <Outlet />
        </div>
      </main>

      <Footer small={!isHome} />
      <ScrollToTop />
    </div>
  );
}
