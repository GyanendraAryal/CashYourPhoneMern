import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Hardened ML Service Client
 * Adds:
 * - Input validation
 * - Value clamping
 * - Confidence handling
 * - Safe fallbacks
 */
class MLService {
  constructor() {
    this.client = axios.create({
      baseURL: ML_SERVICE_URL,
      timeout: 2000,
    });
  }

  // 🔒 Input validation + normalization
  sanitizeInput(basePrice, condition) {
    if (typeof basePrice !== "number" || isNaN(basePrice) || basePrice <= 0) {
      throw new Error("Invalid base price");
    }

    const allowedConditions = ["brand_new", "like_new", "good", "fair", "broken"];
    const normalizedCondition = condition.toLowerCase().replace(" ", "_");
    
    if (!allowedConditions.includes(normalizedCondition)) {
      throw new Error(`Invalid condition: ${condition}`);
    }

    // Clamp price to safe bounds
    const clampedPrice = Math.min(Math.max(basePrice, 500), 1000000);

    return { basePrice: clampedPrice, condition: normalizedCondition };
  }

  // 🧠 Rule-based fallback (CRITICAL)
  fallbackPrice(basePrice, condition) {
    const multipliers = {
      brand_new: 1.0,
      like_new: 0.9,
      good: 0.8,
      fair: 0.7,
      broken: 0.4,
    };

    return Math.round(basePrice * (multipliers[condition] || 0.7));
  }

  /**
   * Predict price for a device
   */
  async predictPrice(basePrice, condition) {
    try {
      const { basePrice: safePrice, condition: safeCondition } =
        this.sanitizeInput(basePrice, condition);

      const { data } = await this.client.post("/predict-price", {
        brand: "unknown",
        model: "unknown",
        condition: safeCondition,
        base_price: safePrice,
      });

      // 🔒 Validate ML response
      if (
        !data ||
        typeof data.estimated_price !== "number" ||
        data.estimated_price <= 0
      ) {
        throw new Error("Invalid ML response");
      }

      // 🔒 Optional: confidence check (if your ML returns it)
      if (data.confidence && data.confidence < 0.7) {
        console.warn("⚠️ Low ML confidence, using fallback");
        return this.fallbackPrice(safePrice, safeCondition);
      }

      return Math.round(data.estimated_price);
    } catch (err) {
      console.warn(
        "⚠️ ML Price Prediction failed, using fallback:",
        err.message
      );
      return this.fallbackPrice(basePrice, condition);
    }
  }


}

export default new MLService();