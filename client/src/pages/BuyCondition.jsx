import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import { useDevices } from "../hooks/useDevices";
import { DeviceListSkeleton } from "../components/skeletons/DeviceSkeleton";
import { motion } from "framer-motion";
import { normalizeDevice } from "../utils/normalize";

const CONDITIONS = ["All", "New", "Like New", "Refurbished", "Pre-Owned"];

const CONDITION_TO_API = {
  New: "new",
  "Like New": "like_new",
  Refurbished: "refurbished",
  "Pre-Owned": "pre_owned",
};

function normalizeConditionLabel(label) {
  if (!label) return "All";
  const v = String(label).trim();
  const cleaned = decodeURIComponent(v).replaceAll("-", " ").toLowerCase();
  if (cleaned === "new") return "New";
  if (cleaned === "like new") return "Like New";
  if (cleaned === "refurbished") return "Refurbished";
  if (cleaned === "pre owned" || cleaned === "pre-owned") return "Pre-Owned";
  return "All";
}

export default function BuyCondition() {
  const { condition: paramCondition } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCondition = useMemo(
    () => normalizeConditionLabel(paramCondition),
    [paramCondition]
  );

  const [condition, setCondition] = useState(initialCondition);

  // Read params
  const q = searchParams.get("q") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "relevance";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  const updateParam = useCallback(
    (key, val) => {
      const next = new URLSearchParams(searchParams);
      const str = String(val ?? "").trim();
      if (!str) next.delete(key);
      else next.set(key, str);
      if (key !== "page") next.set("page", "1");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const fetchParams = useMemo(() => {
    const params = {
      q: q || undefined,
      brand: brand || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort: sort || undefined,
      page,
      limit: 12,
    };
    if (condition && condition !== "All") {
      params.condition = CONDITION_TO_API[condition];
    }
    return params;
  }, [q, brand, minPrice, maxPrice, sort, page, condition]);

  const { data, isLoading, error } = useDevices(fetchParams);
  const products = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((d) => normalizeDevice(d));
  }, [data]);
  const totalPages = data?.pages || 1;

  const onConditionChange = (v) => {
    setCondition(v);
    updateParam("page", "1");
  };

  return (
    <div className="container py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4"
          >
            Find Your Next Phone
          </motion.h1>
          <p className="text-text-muted max-w-2xl mx-auto">
            Browse our wide selection of certified pre-owned and new devices at the best prices in Nepal.
          </p>
        </header>

        {/* Filters Section */}
        <section className="mb-10 rounded-3xl border border-border-muted bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <SearchBar
              value={q}
              onChange={(v) => updateParam("q", v)}
              onSubmit={() => {}}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                className="rounded-xl border border-border-muted bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary-blue-active/20 transition-all"
                placeholder="Brand (e.g. Apple)"
                value={brand}
                onChange={(e) => updateParam("brand", e.target.value)}
              />
              <input
                className="rounded-xl border border-border-muted bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary-blue-active/20 transition-all"
                placeholder="Min NPR"
                type="number"
                value={minPrice}
                onChange={(e) => updateParam("minPrice", e.target.value)}
              />
              <input
                className="rounded-xl border border-border-muted bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary-blue-active/20 transition-all"
                placeholder="Max NPR"
                type="number"
                value={maxPrice}
                onChange={(e) => updateParam("maxPrice", e.target.value)}
              />
              <select
                className="rounded-xl border border-border-muted bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary-blue-active/20 transition-all"
                value={condition}
                onChange={(e) => onConditionChange(e.target.value)}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c} Condition</option>
                ))}
              </select>
              <select
                className="rounded-xl border border-border-muted bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary-blue-active/20 transition-all"
                value={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="newest">Sort: Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </section>

        {/* Results */}
        {error && (
          <div className="mb-10 rounded-2xl bg-primary-blue-active/10 p-4 text-center text-primary-blue-active font-semibold">
            {error?.message || "Failed to load products. Please check your connection."}
          </div>
        )}

        <div className="min-h-[400px]">
          {isLoading ? (
            <DeviceListSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-white-subtle rounded-3xl border border-dashed border-border-muted">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-text-primary">No results found</h3>
              <p className="text-text-muted mt-2">Try adjusting your filters or search terms.</p>
              <button
                onClick={() => setSearchParams({})}
                className="mt-6 text-primary-blue-active font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {products.map((p, i) => (
                <ProductCard key={p._id || i} product={p} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="mt-16 flex items-center justify-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => updateParam("page", page - 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-muted bg-white hover:bg-surface-white-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ←
            </button>
            <span className="text-sm font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => updateParam("page", page + 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-muted bg-white hover:bg-surface-white-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
