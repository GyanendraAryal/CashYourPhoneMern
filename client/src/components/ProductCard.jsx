import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { handleBuyNow } from "../utils/buyFlow";
import { motion } from "framer-motion";
import { resolveImageUrl } from "../utils/resolveImageUrl";

function pickPrimaryImage(product) {
  const raw =
    product?.image ||
    product?.thumbnail ||
    (Array.isArray(product?.images) ? product.images[0] : null);
  if (typeof raw === "string" && raw.trim()) {
    return resolveImageUrl(raw.trim(), "/phone-placeholder.png");
  }
  return "/phone-placeholder.png";
}

export default function ProductCard({ product, index = 0 }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  if (!product) return null;

  const name = product.name || "Unnamed Device";
  const brand = product.brand || "Unknown Brand";

  const price =
    product.price && Number(product.price) > 0
      ? `NPR ${Number(product.price).toLocaleString()}`
      : "Price N/A";

  const availability = product.availability || "Unknown";
  const condition = product.condition || "Unknown";
  const image = pickPrimaryImage(product);
  const availabilityKey = product?.availabilityKey || "";

  const id = product?._id || product?.id;

  const isOutOfStock = useMemo(() => {
    const aKey = String(availabilityKey || "").toLowerCase();
    if (aKey) return aKey === "out_of_stock";
    const a = String(availability).toLowerCase();
    return a.includes("out");
  }, [availabilityKey, availability]);

  const handleBuy = async (e) => {
    e?.stopPropagation?.();
    try {
      await handleBuyNow({
        user,
        product,
        productId: id,
        isOutOfStock,
        addToCart,
        navigate: (to) => nav(to),
        toast,
      });
    } catch (err) {
      console.warn("Buy failed:", err);
      toast.error(err?.message || "Could not complete buy action");
    }
  };

  const onAddToCart = async (e) => {
    e?.stopPropagation?.();
    if (!id) return;
    if (isOutOfStock) {
      toast.error("This item is out of stock");
      return;
    }

    const thumbnail = pickPrimaryImage(product);
    const unitPriceSnapshot = Number(product?.price || 0);

    try {
      setAdding(true);
      await addToCart(id, 1, {
        meta: { nameSnapshot: name, thumbnailSnapshot: thumbnail, unitPriceSnapshot },
      });
      toast.success("Added to cart");
    } catch (err) {
      console.warn("Add to cart failed:", err);
      toast.error(err?.userMessage || "Could not add to cart");
    } finally {
      setAdding(false);
    }
  };

  const onCardClick = () => {
    if (!id) return;
    nav(`/product/${id}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onClick={onCardClick}
      className={[
        "group relative w-full overflow-hidden rounded-2xl border border-border-muted bg-white",
        "shadow-sm transition-shadow hover:shadow-xl",
        "cursor-pointer focus:outline-none focus:ring-2 focus:ring-border-muted",
      ].join(" ")}
    >
      <div className="relative aspect-[4/3] bg-surface-white-subtle overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-contain p-6"
        />

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {isOutOfStock && (
            <span className="rounded-full bg-primary-blue-active/90 px-3 py-1 text-xs font-semibold text-white">
              Out of Stock
            </span>
          )}
          {!isOutOfStock &&
            (availabilityKey === "coming_soon" ||
              String(availability).toLowerCase().includes("coming")) && (
              <span className="rounded-full bg-primary-blue-muted/90 px-3 py-1 text-xs font-semibold text-white">
                Limited
              </span>
            )}
        </div>
      </div>

      <div className="p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-text-primary">
            {name}
          </h3>
          <p className="mt-1 truncate text-sm text-text-muted">{brand}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-surface-white-subtle px-2.5 py-1 text-xs font-semibold text-text-primary">
              {condition}
            </span>
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                isOutOfStock
                  ? "bg-surface-white-subtle text-text-primary"
                  : "bg-success-green-muted text-success-green-dark",
              ].join(" ")}
            >
              <span
                className={[
                  "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                  isOutOfStock ? "bg-surface-white-subtle" : "bg-success-green",
                ].join(" ")}
              />
              {availability}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight text-text-primary">
            {price}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(e); }}
            disabled={adding || isOutOfStock}
            className={[
              "inline-flex items-center justify-center rounded-xl px-3 py-2.5",
              "text-sm font-semibold shadow-sm focus:outline-none",
              adding || isOutOfStock
                ? "bg-surface-white-subtle text-text-muted cursor-not-allowed"
                : "bg-white text-text-primary border border-border-muted hover:bg-surface-white-subtle",
            ].join(" ")}
          >
            {adding ? "..." : "Cart"}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleBuy(e); }}
            className={[
              "inline-flex items-center justify-center rounded-xl px-3 py-2.5",
              "text-sm font-semibold shadow-sm",
              isOutOfStock
                ? "bg-primary-blue-active text-white hover:bg-black"
                : "bg-success-green text-white hover:bg-success-green-hover",
            ].join(" ")}
          >
            Buy
          </button>
        </div>
      </div>
    </motion.article>
  );
}
