import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDevices } from "../hooks/useDevices";
import SearchDropdown from "./SearchDropdown";
import { normalizeDevice } from "../utils/normalize";

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search phones (e.g., iPhone 13)...",
  debounceMs = 300,
}) {
  const [local, setLocal] = useState(value || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const tRef = useRef(null);

  // Suggestions hook
  const { data, isLoading } = useDevices({
    q: local,
    limit: 6,
    enabled: local.length >= 2,
  });

  const results = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((d) => normalizeDevice(d));
  }, [data]);

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  useEffect(() => {
    if (!onChange) return;
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      onChange(local);
    }, debounceMs);
    return () => clearTimeout(tRef.current);
  }, [local, onChange, debounceMs]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowDropdown(false);
          onSubmit?.();
        }}
        className="w-full flex gap-2"
      >
        <div className="relative flex-1">
          <input
            value={local}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setLocal(e.target.value);
              setShowDropdown(true);
            }}
            className="w-full rounded-xl border border-border-muted bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-blue-active/20"
            placeholder={placeholder}
          />
          {local.length > 0 && (
            <button
              type="button"
              onClick={() => { setLocal(""); onChange(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="rounded-xl bg-black text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      <SearchDropdown
        results={results}
        isLoading={isLoading}
        visible={showDropdown && local.length >= 2}
        onClose={() => setShowDropdown(false)}
      />
    </div>
  );
}
