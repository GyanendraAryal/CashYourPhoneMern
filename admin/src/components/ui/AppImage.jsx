import React from "react";

export default function AppImage({
  src,
  alt = "",
  className = "",
  fallback = "https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image",
  ...props
}) {
  const [error, setError] = React.useState(false);

  const handleError = (e) => {
    if (!error) {
      setError(true);
      e.target.src = fallback;
    }
  };

  // Reset error state if src changes
  React.useEffect(() => {
    setError(false);
  }, [src]);

  if (!src) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center border border-gray-100 ${className}`}
      >
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${error ? "opacity-50 grayscale transition-opacity" : ""}`}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}