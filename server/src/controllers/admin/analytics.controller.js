import * as analyticsService from "../../services/analytics.service.js";

export const getFullAnalytics = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    const fraud = await analyticsService.getFraudAlerts();
    
    res.status(200).json({
      status: "success",
      data: {
        ...stats,
        fraudAlerts: fraud
      }
    });
  } catch (err) {
    next(err);
  }
};
