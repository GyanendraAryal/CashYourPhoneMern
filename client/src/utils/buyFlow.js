export const WHATSAPP_NUMBER = "+9779702106079";

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

export function buildWhatsAppProductMessage(product, opts = {}) {
  const p = product || {};
  const name = p.name || "Device";
  const brand = p.brand || "Unknown Brand";
  const condition = p.condition || "Unknown";
  const availability = p.availability || p.availabilityLabel || "Unknown";
  const priceNum = Number(p.price || 0);
  const price = priceNum > 0 ? `NPR ${priceNum.toLocaleString()}` : "Price N/A";

  const url = opts.url || (typeof window !== "undefined" ? window.location.href : "");

  return `Hello! I'm interested in this phone:

📱 *${name}*
🏷️ Brand: ${brand}
💰 Price: ${price}
🛍️ Condition: ${condition}
📦 Availability: ${availability}
${url ? `\n🔗 Link: ${url}` : ""}

Please share more details.`;
}

export function openWhatsApp(message, phone = WHATSAPP_NUMBER) {
  const pn = normalizePhone(phone);
  const text = encodeURIComponent(String(message || ""));
  window.open(`https://wa.me/${pn}?text=${text}`, "_blank", "noopener,noreferrer");
}

/**
 * Unified Buy behavior:
 * - If logged in: add to cart, then redirect to /cart
 * - If not logged in: open WhatsApp (no cart mutation)
 */
export async function handleBuyNow({
  user,
  product,
  productId,
  isOutOfStock,
  addToCart,
  navigate,
  toast,
  whatsappNumber = WHATSAPP_NUMBER,
}) {
  if (isOutOfStock) {
    toast?.error?.("This item is out of stock");
    return { mode: "blocked" };
  }

  if (!user) {
    const msg = buildWhatsAppProductMessage(product);
    openWhatsApp(msg, whatsappNumber);
    toast?.("Redirecting to WhatsApp…", { icon: "💬" });
    return { mode: "whatsapp" };
  }

  if (!productId) {
    toast?.error?.("Missing product id");
    return { mode: "error" };
  }

  await addToCart(productId, 1);
  toast?.success?.("Added to cart");
  navigate?.("/cart");
  return { mode: "cart" };
}
