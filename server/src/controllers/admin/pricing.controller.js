import GlobalConfig from "../../models/GlobalConfig.js";

export const getPricingConfig = async (req, res, next) => {
  try {
    let config = await GlobalConfig.findOne({ key: "pricing_config" });
    if (!config) {
      config = {
        value: {
          weights: { new: 1.0, like_new: 0.9, refurbished: 0.8, pre_owned: 0.7 },
          useML: true,
          margin: 0.1
        }
      };
    }
    res.json({ status: "success", data: config.value });
  } catch (err) {
    next(err);
  }
};

export const updatePricingConfig = async (req, res, next) => {
  try {
    const { weights, useML, margin } = req.body;
    const config = await GlobalConfig.findOneAndUpdate(
      { key: "pricing_config" },
      { value: { weights, useML, margin } },
      { upsert: true, new: true }
    );
    res.json({ status: "success", data: config.value });
  } catch (err) {
    next(err);
  }
};
