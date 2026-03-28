import React, { useEffect, useId, useMemo, useState } from "react";
import api from "../lib/api";

function Chevron({ open }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"
        }`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkeletonItem() {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-6 md:p-7 animate-pulse">
      <div className="h-5 w-2/3 bg-slate-700/60 rounded mb-3" />
      <div className="h-4 w-full bg-slate-700/60 rounded mb-2" />
      <div className="h-4 w-5/6 bg-slate-700/60 rounded" />
    </div>
  );
}

export default function FAQ() {
  const [items, setItems] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const baseId = useId();

  const toggle = (index) => {
    setOpenIndex((cur) => (cur === index ? null : index));
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get("/api/v1/faqs");
        const list = res?.data?.faqs || [];
        if (alive) setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.message || "Failed to load FAQs");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const title = useMemo(() => "Frequently Asked Questions", []);
  const subtitle = useMemo(
    () => "Quick answers about buying & selling with CashYourPhone.",
    []
  );

  return (
    <section className="bg-slate-50">
      <div className="container mx-auto px-4 py-14 md:py-16 max-w-4xl">
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
            {title}
          </h1>

          <p className="mt-3 text-slate-600 text-base md:text-lg">
            {subtitle}
          </p>

        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-500/30 bg-slate-900 p-5 text-red-400">
            {err}
          </div>
        ) : !items.length ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-400">
            No FAQs available right now.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item, index) => {
              const open = openIndex === index;
              const contentId = `${baseId}-faq-panel-${index}`;

              return (
                <div
                  key={item._id || index}
                  className={[
                    "group rounded-2xl border bg-slate-900 shadow-sm",
                    "border-slate-700/60",
                    "transition-all duration-300",
                    open
                      ? "ring-2 ring-blue-500/30 bg-slate-800"
                      : "hover:border-blue-500/40 hover:bg-slate-800",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={open}
                    aria-controls={contentId}
                    className="w-full flex items-start justify-between gap-4 p-5 md:p-6 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "mt-1 inline-flex h-2.5 w-2.5 rounded-full",
                            open ? "bg-blue-400" : "bg-blue-400/50",
                          ].join(" ")}
                          aria-hidden="true"
                        />

                        <span className="text-lg md:text-xl font-semibold text-slate-100">
                          {item.question}
                        </span>
                      </div>
                    </div>

                    <span
                      className={[
                        "mt-1 inline-flex items-center justify-center rounded-full",
                        "border border-slate-700 p-2",
                        "text-blue-400",
                        "transition-colors duration-200",
                        open
                          ? "bg-blue-500/10 border-blue-500/40"
                          : "group-hover:bg-blue-500/10 group-hover:border-blue-500/30",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      <Chevron open={open} />
                    </span>
                  </button>

                  <div
                    id={contentId}
                    className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 md:px-6 md:pb-6">
                        <div className="h-px bg-slate-700 mb-4" />

                        <p className="text-slate-300 leading-relaxed text-base md:text-lg">
                          {item.answer}
                        </p>

                        {open && (
                          <div className="mt-4 inline-flex items-center gap-2 text-sm">
                            <span className="font-semibold text-blue-400">
                              Still stuck?
                            </span>
                            <span className="text-slate-400">
                              Contact support from the Contact page.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
