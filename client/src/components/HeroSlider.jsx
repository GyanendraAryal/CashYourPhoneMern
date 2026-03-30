import React, { useEffect, useMemo, useRef, useState } from "react";
import { getHeroSlides } from "../services/heroService";
import { normalizeSlide } from "../utils/normalize";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for right, -1 for left
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let didCancel = false;

    (async () => {
      try {
        const res = await getHeroSlides();
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const normalized = list
          .map(normalizeSlide)
          .filter((s) => !!(s.imageDesktopUrl || s.imageUrl));

        if (!didCancel) {
          setSlides(normalized);
          setIndex(0);
        }
      } catch (err) {
        console.error("❌ Hero slides fetch failed:", err);
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
    const fallback = "/placeholder.png";
    const d = active?.imageDesktopUrl || active?.imageUrl || fallback;
    const m = active?.imageMobileUrl || "";
    return { desktopSrc: d, mobileSrc: m };
  }, [active]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total > 1) {
      timerRef.current = setInterval(() => {
        setDirection(1);
        setIndex((i) => (i + 1) % total);
      }, 6000);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total]);

  if (!active) {
    return (
      <div className="h-[300px] sm:h-[400px] flex items-center justify-center bg-surface-white-subtle">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-12 h-12 rounded-full border-4 border-primary-blue-muted border-t-primary-blue-active animate-spin mb-4" />
           <p className="text-text-muted font-medium">Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = total - 1;
      if (nextIndex >= total) nextIndex = 0;
      return nextIndex;
    });
    resetTimer();
  };

  const goTo = (i) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
    resetTimer();
  };

  return (
    <div className="group relative w-full overflow-hidden bg-black h-[320px] sm:h-[450px] md:h-[650px] lg:h-[700px]">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={index}
          custom={direction}
          variants={{
            enter: (direction) => ({
              x: direction > 0 ? "100%" : "-100%",
              opacity: 0
            }),
            center: {
              zIndex: 1,
              x: 0,
              opacity: 1
            },
            exit: (direction) => ({
              zIndex: 0,
              x: direction < 0 ? "100%" : "-100%",
              opacity: 0
            })
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.6 }
          }}
          className="absolute inset-0"
        >
          {/* Background Image with subtle Ken Burns Effect */}
          <motion.div 
            initial={{ scale: 1.1, x: 0 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ duration: 8, ease: "linear" }}
            className="absolute inset-0"
          >
            {mobileSrc ? (
              <picture>
                <source media="(max-width: 768px)" srcSet={mobileSrc} />
                <img
                  src={desktopSrc}
                  alt={active.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.src = "/placeholder.png")}
                />
              </picture>
            ) : (
              <img
                src={desktopSrc}
                alt={active.title || `Slide ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = "/placeholder.png")}
              />
            )}
          </motion.div>

          {/* Overlay Gradients */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/40 to-transparent hidden md:block" />

          {/* Content Container */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="max-w-2xl">
                {/* Animated Typography */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  {active.title && (
                    <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                      {active.title}
                    </h2>
                  )}
                  {active.subtitle && (
                    <p className="mt-4 text-base sm:text-xl text-white/90 font-medium max-w-lg drop-shadow-lg">
                      {active.subtitle}
                    </p>
                  )}
                  
                  {(active.ctaText || active.ctaLink) && (
                    <motion.div 
                      className="mt-8 flex gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <button
                        onClick={() => navigate(active.ctaLink || "/sell")}
                        className="px-8 py-3.5 bg-white text-black font-bold rounded-2xl hover:bg-primary-blue-active hover:text-white transition-all duration-300 shadow-xl active:scale-95"
                      >
                        {active.ctaText || "Get Started"}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Modern Indicators */}
      {total > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-500 rounded-full ${
                i === index 
                  ? "w-10 h-2.5 bg-white" 
                  : "w-2.5 h-2.5 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}