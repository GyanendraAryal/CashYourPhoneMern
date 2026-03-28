import React from "react";
import { Link } from "react-router-dom";

export default function MobileBottomBar() {
  // ⭐ Static WhatsApp number (your request)
  const whatsapp = "https://wa.me/9779702106079";

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-lg z-50 py-2">
      <div className="flex justify-around text-xs font-medium text-black">
        <Link to="/" className="flex flex-col items-center">
          <span>🏠</span>
          Home
        </Link>

        <Link to="/buy" className="flex flex-col items-center">
          <span>📱</span>
          Buy
        </Link>

        <Link to="/sell" className="flex flex-col items-center">
          <span>💸</span>
          Sell
        </Link>

        {/* ⭐ WhatsApp button now works correctly */}
        <a href={whatsapp} className="flex flex-col items-center" target="_blank" rel="noreferrer">
          <span>💬</span>
          WhatsApp
        </a>

        <Link to="/contact" className="flex flex-col items-center">
          <span>☎️</span>
          Contact
        </Link>
      </div>
    </div>
  );
}
