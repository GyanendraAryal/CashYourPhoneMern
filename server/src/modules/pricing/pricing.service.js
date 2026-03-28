import GlobalConfig from "../../models/GlobalConfig.js";
import mlService from "../../services/ml.service.js";
import AppError from "../../utils/AppError.js";

const DEFAULT_WEIGHTS = {
  new: 1.0,
  like_new: 0.9,
  refurbished: 0.8,
  pre_owned: 0.7,
};

export const estimateDeviceValue = async (basePrice, condition) => {
  // 0. Load Config
  const configDoc = await GlobalConfig.findOne({ key: "pricing_config" });
  const config = configDoc?.value || { weights: DEFAULT_WEIGHTS, useML: true };
  const weights = config.weights || DEFAULT_WEIGHTS;

  // 1. Try ML Prediction (if enabled)
  if (config.useML !== false) {
    const mlPred = await mlService.predictPrice(basePrice, condition);
    if (mlPred !== null) {
      return { 
        estimatedPrice: Math.floor(mlPred.estimatedPrice || mlPred), 
        mlEstimatedPrice: Math.floor(mlPred.estimatedPrice || mlPred),
        isMLUsed: true 
      };
    }
  }

  // 2. Fallback to Rule-based logic
  const weight = weights[condition.toLowerCase()] || DEFAULT_WEIGHTS[condition.toLowerCase()];
  if (!weight) throw new AppError("Invalid device condition for pricing", 400);

  const estimatedValue = basePrice * weight;
  const finalPrice = Math.floor(estimatedValue * 0.95);
  
  return { 
    estimatedPrice: finalPrice, 
    mlEstimatedPrice: 0,
    isMLUsed: false 
  };
};

export const getPricingConfigData = async () => {
  const configDoc = await GlobalConfig.findOne({ key: "pricing_config" });
  return configDoc?.value || { weights: DEFAULT_WEIGHTS, useML: true };
};

/**
 * GET current pricing configuration (for Admin)
 */
export const getPricingConfig = () => {
  return {
    weights: DEFAULT_WEIGHTS,
    currency: "NPR",
  };
};
