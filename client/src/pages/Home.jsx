import React, { useMemo } from "react";
import ProductCard from "../components/ProductCard";
import Reviews from "../components/Reviews";
import WhyCashYourPhone from "../components/WhyCashYourPhone";
import FAQ from "./FAQ";
import { useDevices } from "../hooks/useDevices";
import { DeviceListSkeleton } from "../components/skeletons/DeviceSkeleton";
import { motion } from "framer-motion";
import { normalizeDevice } from "../utils/normalize";
import HeroSlider from "../components/HeroSlider";

export default function Home() {
  const { data, isLoading, error } = useDevices({
    featured: true,
    limit: 12,
  });

  // ✅ safer normalization
  const devices = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : [];

    return items
      .map((d) => {
        try {
          return normalizeDevice(d);
        } catch (err) {
          console.warn("Device normalize failed:", err);
          return null;
        }
      })
      .filter(Boolean); // remove broken items
  }, [data]);

  return (
    <>
      {/* Hero Section */}
      <section className="mb-8 sm:mb-10">
        <HeroSlider />
      </section>

      {/* Featured Products */}
      <section className="mt-6 sm:mt-8 mb-12 sm:mb-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center"
          >
            Featured Phones
          </motion.h2>

          {error && (
            <p className="text-center text-primary-blue-active mb-6">
              {error?.message || "Could not load featured phones."}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {isLoading ? (
              <DeviceListSkeleton count={8} />
            ) : devices.length === 0 ? (
              <p className="text-center col-span-full text-text-muted">
                No featured phones available right now.
              </p>
            ) : (
              devices.map((p, i) => (
                <ProductCard
                  key={p?._id || i}
                  product={p || {}}
                  index={i}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why CashYourPhone */}
      <section className="py-10 sm:py-12 mb-12 sm:mb-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <WhyCashYourPhone />
        </div>
      </section>

      {/* Reviews */}
      <section className="py-10 sm:py-12 mb-12 sm:mb-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reviews />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 sm:py-12 mb-12 sm:mb-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <FAQ />
        </div>
      </section>
    </>
  );
}