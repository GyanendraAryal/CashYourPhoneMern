import Order from "../models/Order.js";
import Device from "../models/Device.js";
import User from "../models/User.js";
import SellRequest from "../models/SellRequest.js";

/**
 * Get comprehensive analytics for the Admin Dashboard
 */
export const getDashboardStats = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Core Counts
  const [totalDevices, totalUsers, totalOrders, totalSells] = await Promise.all([
    Device.countDocuments(),
    User.countDocuments({ role: "user" }),
    Order.countDocuments({ status: { $ne: "cancelled" } }),
    SellRequest.countDocuments({ status: { $ne: "closed" }, isDeleted: false }),
  ]);

  // 2. Revenue (30 days)
  const revenueAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, status: "completed" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const monthlyRevenue = revenueAgg[0]?.total || 0;

  // 3. Popular Brands
  const popularBrands = await Device.aggregate([
    { $group: { _id: "$brand", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // 4. Sell Request Trends (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sellTrends = await SellRequest.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: false } },
    { 
      $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
        count: { $sum: 1 } 
      } 
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    overview: {
      totalDevices,
      totalUsers,
      totalOrders,
      totalSells,
      monthlyRevenue,
    },
    popularBrands: popularBrands.map(b => ({ brand: b._id, count: b.count })),
    sellTrends,
    timestamp: now.toISOString(),
  };
};

/**
 * Identify potentially fraudulent activity
 */
export const getFraudAlerts = async () => {
  // Simple heuristic: Users with > 3 cancelled orders in 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const suspiciousUsers = await Order.aggregate([
    { $match: { createdAt: { $gte: yesterday }, status: "cancelled" } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 3 } } }
  ]);

  return suspiciousUsers;
};
