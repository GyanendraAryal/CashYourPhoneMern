import GlobalConfig from "../../models/GlobalConfig.js";
import mlService from "../../services/ml.service.js";
import AppError from "../../utils/AppError.js";

const DEFAULT_WEIGHTS = {
  brand_new: 1.0,
  like_new: 0.9,
  good: 0.8,
  fair: 0.7,
  broken: 0.4,
};

export const estimateDeviceValue = async (basePrice, condition) => {
  // 0. Load Config
  const configDoc = await GlobalConfig.findOne({ key: "pricing_config" });
  const config = configDoc?.value || { weights: DEFAULT_WEIGHTS, useML: true, margin: 0.1 };
  const weights = config.weights || DEFAULT_WEIGHTS;
  const margin = config.margin ?? 0.1; // Default to 10% margin

  // 1. Try ML Prediction (if enabled)
  if (config.useML !== false) {
    // Map internal condition to ML condition name if necessary
    // For now, ml.service.js also needs alignment
    const mlPred = await mlService.predictPrice(basePrice, condition);
    if (mlPred !== null) {
      // If ML is used, we still apply the business margin? 
      // Usually ML predicts the 'fair market value', then we apply margin.
      const finalPrice = Math.floor(mlPred * (1 - margin));
      return { 
        estimatedPrice: finalPrice, 
        mlEstimatedPrice: Math.floor(mlPred),
        isMLUsed: true 
      };
    }
  }

  // 2. Fallback to Rule-based logic
  const weight = weights[condition.toLowerCase().replace(" ", "_")] || DEFAULT_WEIGHTS[condition.toLowerCase().replace(" ", "_")];
  if (!weight) throw new AppError(`Invalid device condition: ${condition} for pricing`, 400);

  const estimatedValue = basePrice * weight;
  const finalPrice = Math.floor(estimatedValue * (1 - margin));
  
  return { 
    estimatedPrice: finalPrice, 
    mlEstimatedPrice: 0,
    isMLUsed: false 
  };
};

export const getPricingConfigData = async () => {
  const configDoc = await GlobalConfig.findOne({ key: "pricing_config" });
  const config = configDoc?.value || { weights: DEFAULT_WEIGHTS, useML: true, margin: 0.1 };
  // Ensure all keys exist
  return {
    weights: { ...DEFAULT_WEIGHTS, ...config.weights },
    useML: config.useML ?? true,
    margin: config.margin ?? 0.1
  };
};

/**
 * GET current pricing configuration (for Admin UI compatibility)
 */
export const getPricingConfig = async () => {
  return await getPricingConfigData();
};
