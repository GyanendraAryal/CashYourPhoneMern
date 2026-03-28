import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram } from "react-icons/fa";
import { CgMail } from "react-icons/cg";
import { FaFacebook } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa6";
import logo from "/assets/logo.png"

export default function Footer({ small }) {
  const WHATSAPP = "9779702106079";

  const icon = (path) => `/icons/${path}`;

  return (
    <footer
      className={`bg-surface-white-subtle border-t mt-12 ${small ? "py-6" : "pt-12 pb-10"}`}
    >
      {/* Center Wrapper */}
      <div className=" flex justify-center">
        <div
          className={` px-6 md:px-12 grid justify-center gap-5 md:gap-16 lg:gap-24 md:grid-cols-3 ${small ? "text-sm" : "text-base"
            }`}
        >
          {/* About */}
          <div className="space-y-3">
            <img src={logo} alt="Cash Your Phone Logo" className="h-14" />
            <p className="text-text-primary leading-relaxed">
              CashYourPhone — Trusted store at Sonauli border for new & used phones.
              Best prices • Genuine devices • Hassle-free service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className={`font-bold mb-4 ${small ? "text-base" : "text-lg"
                } text-text-primary`}
            >
              Quick Links
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://www.instagram.com/cash_your_phone_?utm_source=ig_web_button_share_sheet"
                target="_blank"
                className="flex items-center gap-3 bg-white border rounded-lg p-2 hover:shadow-md hover:-translate-y-1 transition"
              >
                <FaInstagram className="text-primary-blue-active text-xl" />
                Instagram
              </a>

              <a
                href="https://facebook.com/"
                target="_blank"
                className="flex items-center gap-3 bg-white border rounded-lg p-2 hover:shadow-md hover:-translate-y-1 transition"
              >
                <FaFacebook className="text-primary-blue text-xl" />
                Facebook
              </a>

              <a
                href="https://www.tiktok.com/@cash_your_phone_?is_from_webapp=1"
                target="_blank"
                className="flex items-center gap-3 bg-white border rounded-lg p-2 hover:shadow-md hover:-translate-y-1 transition"
              >
                <img src="/icons/tiktok.png" className="h-7 w-7" alt="TikTok" />
                TikTok
              </a>

              <a
                href="mailto:cashyourphone3@gmail.com"
                className="flex items-center gap-3 bg-white border rounded-lg p-2 hover:shadow-md hover:-translate-y-1 transition"
              >
                <CgMail className="text-black text-xl" />
                Gmail
              </a>

              <a
                href="https://youtube.com/@cashyourphone?si=LOp5IWBJjxFEPR6P"
                target="_blank"
                className="flex items-center gap-3 bg-white border rounded-lg p-2 hover:shadow-md hover:-translate-y-1 transition"
              >
                <FaYoutube className="text-primary-blue-active text-xl" />
                YouTube
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="flex
          md:justify-center ">
            <div>
            <h4
              className={`font-bold mb-4 ${small ? "text-base" : "text-lg"
                } text-text-primary`}
            >
              Support
            </h4>

            <div className="flex flex-col gap-2  text-text-primary">
              <Link to="/contact" className="hover:underline hover:text-black">
                Contact
              </Link>
              <Link to="/warranty" className="hover:underline hover:text-black">
                Warranty
              </Link>
              <Link to="/faq" className="hover:underline hover:text-black">
                FAQ
              </Link>
              <Link to="/reviews" className="hover:underline hover:text-black">
                Reviews
              </Link>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t mt-12 pt-4">
        <p
          className={`text-center ${small ? "text-sm" : "text-base"
            } text-text-muted`}
        >
          © {new Date().getFullYear()} Cash Your Phone. All rights reserved.
        </p>
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${WHATSAPP}`}
        className="fixed right-5 bottom-6 z-50 bg-white rounded-full shadow-xl p-2 hover:scale-110 transition"
        target="_blank"
      >
        <FaWhatsapp className="text-success-green" style={{ fontSize: "50px" }} />
      </a>
    </footer>
  );
}
