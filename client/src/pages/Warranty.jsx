import React from "react";

export default function Warranty() {
  return (
    <div className="container py-12 px-4 md:px-8 mt-16">
      {/* Page Title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-10 text-[var(--brand-dark)] text-center">
        Warranty & Protection
      </h1>

      {/* Warranty Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Used Phones */}
        <div className="bg-white p-6 rounded-xl shadow-md border flex flex-col items-start gap-4 transition-transform transform hover:scale-105 hover:shadow-xl">
          <div className="text-4xl">📱</div>
          <h3 className="text-xl font-semibold text-[var(--brand-blue)]">Used Phones</h3>
          <p className="text-text-primary">
            6 months warranty. Additionally, a 15-day check time is provided for used phones.
            <br />
            <strong>Exchange allowed.</strong> (No cash backs)
          </p>
        </div>

        {/* New Phones */}
        <div className="bg-white p-6 rounded-xl shadow-md border flex flex-col items-start gap-4 transition-transform transform hover:scale-105 hover:shadow-xl">
          <div className="text-4xl">🆕</div>
          <h3 className="text-xl font-semibold text-[var(--brand-blue)]">New Phones</h3>
          <p className="text-text-primary">
            1 year warranty included with every new phone purchase.
          </p>
        </div>

        {/* All Purchases */}
        <div className="bg-white p-6 rounded-xl shadow-md border flex flex-col items-start gap-4 transition-transform transform hover:scale-105 hover:shadow-xl">
          <div className="text-4xl">🎁</div>
          <h3 className="text-xl font-semibold text-[var(--brand-blue)]">All Purchases</h3>
          <p className="text-text-primary">
            Free accessories included. <span className="text-primary-blue-active font-semibold">No cashbacks.</span>
          </p>
        </div>
      </div>

      {/* Contact Button */}
      <div className="text-center mt-6">
        <a
          href="https://wa.me/9779702106079"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[var(--brand-blue)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--brand-blue-dark)] transition"
        >
          Contact Warranty Support on WhatsApp
        </a>
      </div>
    </div>
  );
}
