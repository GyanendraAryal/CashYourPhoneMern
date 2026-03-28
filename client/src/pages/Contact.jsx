import React from "react";

export default function Contact() {

  // ⭐ EDIT THESE VALUES YOURSELF ⭐
  const CONTACT = {
    phone: "+977-9812345678",
    whatsapp: "+977-9812345678",
    address: "Sonauli Border, Near India–Nepal Gate",
    mapsIframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3539.9341475170127!2d83.46319817516327!3d27.47130943586303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39969986ec806c21%3A0x51f0108ae1fcc6c!2sCash%20your%20phone%20sonauli!5e0!3m2!1sen!2snp!4v1763661221671!5m2!1sen!2snp",
  };

  const methods = [
    {
      type: "Call",
      icon: "📞",
      value: CONTACT.phone,
      link: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}`,
      bgColor: "bg-[var(--brand-blue)]",
      hoverColor: "hover:bg-[var(--brand-blue-dark)]",
      textColor: "text-white",
    },
    {
      type: "WhatsApp",
      icon: "💬",
      value: CONTACT.whatsapp,
      link: `https://wa.me/${CONTACT.whatsapp.replace(/[^0-9]/g, "")}`,
      bgColor: "bg-success-green",
      hoverColor: "hover:bg-success-green-hover",
      textColor: "text-white",
    },
    {
      type: "Location",
      icon: "📍",
      value: CONTACT.address,
      link: 'https://maps.app.goo.gl/kfued7whyKTkHzfX8',
      bgColor: "bg-primary-blue-active",
      hoverColor: "hover:bg-black",
      textColor: "text-white",
    },
  ];

  return (
    <div className="container py-10">

      {/* Page Heading */}
      <h1 className="mt-4 text-4xl font-bold mb-4 text-[var(--brand-dark)]">
        Contact Us
      </h1>
      <p className="text-lg text-text-muted mb-8 max-w-xl">
        Reach us anytime — we're here to help you buy, sell, or exchange phones.
      </p>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {methods.map((m) => (
          <div
            key={m.type}
            className="bg-white p-6 rounded-xl shadow-md border hover:shadow-xl transition"
          >
            <h3
              className={`text-xl font-semibold mb-2 ${m.icon === "💬"
                  ? "text-success-green"
                  : m.icon === "📍"
                    ? "text-[var(--brand-dark)]"
                    : "text-[var(--brand-blue)]"
                }`}
            >
              {m.icon} {m.type}
            </h3>

            <p className="text-text-primary font-medium text-lg">{m.value}</p>

            <a
              href={m.link}
              target="_blank"
              rel="noreferrer"
              className={`mt-3 inline-block px-4 py-2 rounded-lg ${m.bgColor} ${m.textColor} ${m.hoverColor} font-semibold transition`}
            >
              {m.type === "Call"
                ? "Call Now"
                : m.type === "WhatsApp"
                  ? "Chat on WhatsApp"
                  : "Open in Maps"}
            </a>
          </div>
        ))}
      </div>

      {/* Google Map */}
      <div className="w-full h-[320px] md:h-[420px] rounded-xl overflow-hidden shadow-lg border">
        <iframe
          title="Store Location"
          width="100%"
          height="100%"
          loading="lazy"
          allowFullScreen
          style={{ border: 0 }}
          referrerPolicy="no-referrer-when-downgrade"
          src={CONTACT.mapsIframe}
        ></iframe>
      </div>
    </div>
  );
}
