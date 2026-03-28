import React from "react";
import { FaShieldAlt, FaExchangeAlt, FaMobileAlt, FaSmileBeam } from "react-icons/fa";

export default function WhyCashYourPhone() {
  const features = [
    {
      id: 1,
      icon: <FaShieldAlt className="text-primary-blue text-4xl" />,
      title: "Genuine & Verified",
      description: "Every device is strictly quality-checked and verified for authenticity before selling.",
    },
    {
      id: 2,
      icon: <FaExchangeAlt className="text-success-green text-4xl" />,
      title: "Best Prices",
      description: "We offer the best market value for buying, selling, and exchanging smartphones.",
    },
    {
      id: 3,
      icon: <FaMobileAlt className="text-primary-blue text-4xl" />,
      title: "Premium Devices",
      description: "Find the latest iPhones and Samsung smartphones in excellent condition at fair prices.",
    },
    {
      id: 4,
      icon: <FaSmileBeam className="text-primary-blue-active text-4xl" />,
      title: "Trusted Store",
      description: "Thousands of happy customers trusted our reliable service at the Sonauli border.",
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      {/* Soft background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-white-subtle to-white" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-black/5 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-black/5 blur-3xl" />

      <div className="relative container px-4 md:px-8">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto">

          <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary">
            Why Choose{" "}
            <span className="text-[var(--brand-dark)]">CashYourPhone?</span>
          </h2>

          <p className="mt-4 text-text-muted text-base md:text-lg leading-relaxed">
            Your trusted partner for buying, selling, and exchanging premium smartphones
            with confidence and convenience.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((item) => (
            <div
              key={item.id}
              className="
                group relative overflow-hidden rounded-2xl border border-border-muted bg-white
                p-7 md:p-8 shadow-sm transition-all duration-300
                hover:-translate-y-1 hover:shadow-xl
              "
            >
              {/* subtle hover glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-black/5 blur-2xl" />
              </div>

              {/* icon badge */}
              <div className="flex items-center justify-center">
                <div className="h-14 w-14 rounded-2xl bg-surface-white-subtle border border-border-muted flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  {item.icon}
                </div>
              </div>

              <h3 className="mt-5 text-xl font-bold text-text-primary text-center">
                {item.title}
              </h3>

              <p className="mt-3 text-sm md:text-[15px] text-text-muted leading-relaxed text-center">
                {item.description}
              </p>

              {/* bottom accent line */}
              <div className="mt-6 h-[2px] w-10 mx-auto rounded-full bg-surface-white-subtle group-hover:bg-primary-blue-active transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
