import * as pricingService from "./pricing.service.js";

export const getEstimate = async (req, res, next) => {
  try {
    const { basePrice, condition } = req.body;
    const value = await pricingService.estimateDeviceValue(Number(basePrice), condition);
    
    res.status(200).json({
      status: "success",
      data: {
        estimatedValue: value,
        currency: "NPR"
      }
    });
  } catch (err) {
    next(err);
  }
};
