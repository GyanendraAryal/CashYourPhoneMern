// client/src/components/HeroSlider.jsx — FULLY REPLACEABLE (RESPONSIVE + NO JANK)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getHeroSlides } from "../services/heroService";
import { normalizeSlide } from "../utils/normalize";

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  // fetch slides once
  useEffect(() => {
    let didCancel = false;

    (async () => {
      try {
        const res = await getHeroSlides({ limit: 20 });
        const list = Array.isArray(res.data?.slides)
          ? res.data.slides
          : Array.isArray(res.data)
          ? res.data
          : [];

        const normalized = list
          .map(normalizeSlide)
          .filter((s) => !!(s.imageDesktopUrl || s.imageUrl));

        if (!didCancel) {
          setSlides(normalized);
          setIndex(0);
        }
      } catch (err) {
        console.warn("Failed to fetch hero slides:", err);
        if (!didCancel) setSlides([]);
      }
    })();

    return () => {
      didCancel = true;
    };
  }, []);

  const total = slides.length;
  const active = slides[index] || null;

  const { desktopSrc, mobileSrc } = useMemo(() => {
    const d = active?.imageDesktopUrl || active?.imageUrl || "";
    const m = active?.imageMobileUrl || "";
    return { desktopSrc: d, mobileSrc: m };
  }, [active]);

  // auto-advance (smooth fade, no nested timeouts)
  useEffect(() => {
    if (total <= 1) return;

    // clear any old interval
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [total]);

  if (!active) return null;

  const goTo = (i) => setIndex(i);

  return (
    <div
      className="
        relative w-full overflow-hidden shadow
        h-[300px] sm:h-[380px] md:h-[650px] lg:h-[665px]
      "
    >
      {/* Background image layer */}
      <div className="absolute inset-0">
        {mobileSrc ? (
          <picture>
            <source media="(max-width: 768px)" srcSet={mobileSrc} />
            <img
              src={desktopSrc}
              alt={active.title || `Slide ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
            />
          </picture>
        ) : (
          <img
            src={desktopSrc}
            alt={active.title || `Slide ${index + 1}`}
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
          />
        )}

        {/* Crossfade overlay (no cropping changes, just opacity) */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Text content */}
      {(active.title || active.subtitle) && (
        <div className="absolute inset-0 flex items-end">
          <div className="p-6 md:p-10 text-white max-w-3xl">
            {active.title && (
              <h2 className="text-2xl md:text-4xl font-extrabold drop-shadow">
                {active.title}
              </h2>
            )}
            {active.subtitle && (
              <p className="mt-2 text-base md:text-lg opacity-95 drop-shadow">
                {active.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation dots */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 w-8 rounded-full ${
                i === index ? "bg-white" : "bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
