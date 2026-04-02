import React, { useMemo, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useDevice, useRecommendations } from "../hooks/useDevices";
import ProductReviews from "../components/ProductReviews";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { handleBuyNow } from "../utils/buyFlow";
import { motion } from "framer-motion";
import { normalizeDevice } from "../utils/normalize";

export default function ProductDetail() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { id } = useParams();

  const { data, isLoading: loading, error } = useDevice(id);
  const { data: recommendationsData, isLoading: recLoading } = useRecommendations(id);

  const rawDevice = data?.data;
  const product = useMemo(
    () => (rawDevice ? normalizeDevice(rawDevice, { includeImages: true }) : null),
    [rawDevice]
  );

  const recommendations = useMemo(() => {
    const arr = recommendationsData?.data;
    if (!Array.isArray(arr)) return [];
    return arr.map((p) => normalizeDevice(p));
  }, [recommendationsData]);

  const [adding, setAdding] = React.useState(false);

  const isOutOfStock = useMemo(() => {
    const key = String(product?.availabilityKey || "").toLowerCase();
    if (key) return key === "out_of_stock";
    const a = String(product?.availability || "").toLowerCase();
    return a.includes("out");
  }, [product?.availabilityKey, product?.availability]);

  const onAddToCart = useCallback(async () => {
    if (!user) {
      toast("Please login to add items to your cart", { icon: "🔐" });
      nav(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!product?._id && !product?.id) {
      toast.error("Product not loaded");
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id || product.id, 1, {
        meta: {
          nameSnapshot: product.name,
          thumbnailSnapshot: product.image || "/phone-placeholder.png",
          unitPriceSnapshot: Number(product.price || 0),
        },
      });
      toast.success("Added to cart");
    } catch (e) {
      console.warn("Add to cart failed:", e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Could not add to cart";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  }, [user, product, addToCart, nav]);

  const onBuyNow = useCallback(async () => {
    try {
      await handleBuyNow({
        user,
        product,
        productId: product?._id || product?.id,
        isOutOfStock,
        addToCart,
        navigate: (to) => nav(to),
        toast,
      });
    } catch (e) {
      console.warn("Buy now failed:", e);
      toast.error(e?.message || "Could not complete buy action");
    }
  }, [user, product, isOutOfStock, addToCart, nav]);

  if (loading) {
    return (
      <div className="container py-16 px-4 md:px-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-blue-active border-t-transparent" />
        <p className="mt-4 text-text-muted font-medium">Loading device details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-16 px-4 md:px-8 text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-bold text-text-primary">
          {error?.message || "Product not found."}
        </h2>
        <Link 
          to="/buy" 
          className="inline-block mt-8 bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const {
    name,
    brand,
    price,
    condition,
    availability,
    image,
    feature,
    description
  } = product;

  return (
    <div className="container py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-border-muted p-8 shadow-sm flex items-center justify-center"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={image || "/phone-placeholder.png"}
              alt={name}
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <nav className="flex gap-2 text-sm text-text-muted mb-4">
              <Link to="/" className="hover:text-primary-blue-active">Home</Link>
              <span>/</span>
              <Link to="/buy" className="hover:text-primary-blue-active">Store</Link>
              <span>/</span>
              <span className="text-text-primary font-medium truncate">{name}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary leading-tight">
              {name}
            </h1>
            
            <div className="mt-4 flex items-center gap-3">
              <span className="bg-surface-white-subtle text-text-primary px-3 py-1 rounded-full text-sm font-bold border border-border-muted">
                {brand}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                isOutOfStock ? 'bg-primary-blue-active/10 text-primary-blue-active' : 'bg-success-green-muted text-success-green-dark'
              }`}>
                {availability}
              </span>
            </div>

            <div className="mt-8 border-y border-border-muted py-6">
              <div className="text-4xl font-black text-text-primary">
                NPR {Number(price || 0).toLocaleString()}
              </div>
              <p className="text-sm text-text-muted mt-1">Includes all taxes and official warranty</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface-white-subtle border border-border-muted">
                <div className="text-xs text-text-muted uppercase font-bold tracking-wider">Condition</div>
                <div className="text-lg font-bold text-text-primary mt-1">{condition}</div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-white-subtle border border-border-muted">
                <div className="text-xs text-text-muted uppercase font-bold tracking-wider">Warranty</div>
                <div className="text-lg font-bold text-text-primary mt-1">6 Months</div>
              </div>
            </div>

            {(feature || description) && (
              <div className="mt-10 space-y-6">
                {feature && (
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Key Highlights</h3>
                    <p className="mt-2 text-text-muted leading-relaxed italic border-l-4 border-primary-blue-active pl-4">
                      {feature}
                    </p>
                  </div>
                )}
                {description && (
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Product Details</h3>
                    <p className="mt-2 text-text-muted leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddToCart}
                disabled={adding || isOutOfStock}
                className="flex-1 py-4 px-8 rounded-2xl font-black text-lg transition-all border-2 border-success-green bg-white text-success-green hover:bg-success-green hover:text-white disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add to Cart"}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBuyNow}
                disabled={adding || isOutOfStock}
                className="flex-1 py-4 px-8 rounded-2xl font-black text-lg transition-all bg-success-green text-white hover:bg-success-green-hover shadow-lg shadow-success-green/20 disabled:opacity-50"
              >
                {isOutOfStock ? "Out of Stock" : "Buy Now"}
              </motion.button>
            </div>
            
            <p className="mt-6 text-center text-xs text-text-muted flex items-center justify-center gap-2">
              <span>🔒 Secure Payment via eSewa</span>
              <span className="h-1 w-1 rounded-full bg-text-muted" />
              <span>✓ Genuine Certified Devices</span>
            </p>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 border-t border-border-muted pt-20">
          <ProductReviews productId={id} />
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 border-t border-border-muted pt-20 pb-10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-black text-text-primary">Recommended for You</h2>
                <p className="text-text-muted mt-1 italic">Based on your current interest in {product?.name}</p>
              </div>
              <Link to="/buy" className="text-primary-blue-active font-bold hover:underline">View All Phones →</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {recommendations.map((p, i) => (
                <ProductCard key={p._id || i} product={p} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
