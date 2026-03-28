import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchDropdown({ results, isLoading, visible, onClose }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-border-muted bg-white shadow-2xl"
        >
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-blue-active border-t-transparent" />
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col gap-1">
                {results.map((device) => (
                  <Link
                    key={device._id || device.id}
                    to={`/product/${device._id || device.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-white-subtle transition-colors"
                  >
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-surface-white-subtle p-1">
                      <img
                        src={device.image || "/phone-placeholder.png"}
                        alt={device.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-text-primary">
                        {device.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {device.brand} · NPR {device.price?.toLocaleString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-text-muted">
                No phones found matching your search.
              </div>
            )}
          </div>
          
          <div className="border-t border-border-muted bg-surface-white-subtle p-3 text-center">
            <button
              onClick={onClose}
              className="text-xs font-bold text-primary-blue-active uppercase tracking-wider hover:underline"
            >
              Close Suggestions
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
