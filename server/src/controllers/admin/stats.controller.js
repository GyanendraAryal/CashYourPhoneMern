import Review from "../../models/Review.js";
import SellRequest from "../../models/SellRequest.js";
import Device from "../../models/Device.js";
import HeroSlide from "../../models/HeroSlide.js";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import ProductReview from "../../models/ProductReview.js";
import AdminNotification from "../../models/AdminNotification.js";

export async function getStats(req, res, next) {
  try {
    const [
      devices,
      heroSlides,
      reviews,
      pendingReviews,
      sellRequests,
      users,
      orders,
      pendingProductReviews,
      unreadNotifications,
      unreadNewUsers,
      unreadNewOrders,
      unreadNewSellRequests,
      unreadNewReviews,
      unreadNewProductReviews,
    ] = await Promise.all([
      Device.countDocuments(),
      HeroSlide.countDocuments(),
      Review.countDocuments(),
      Review.countDocuments({
        $or: [
          { status: "pending" },
          { status: { $exists: false }, active: false },
        ],
      }),
      SellRequest.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments(),
      Order.countDocuments(),
      ProductReview.countDocuments({ status: "pending" }),
      AdminNotification.countDocuments({ readAt: null }),
      AdminNotification.countDocuments({ readAt: null, type: "NEW_USER" }),
      AdminNotification.countDocuments({ readAt: null, type: "NEW_ORDER" }),
      AdminNotification.countDocuments({ readAt: null, type: "NEW_SELL_REQUEST" }),
      AdminNotification.countDocuments({ readAt: null, type: "NEW_REVIEW" }),
      AdminNotification.countDocuments({ readAt: null, type: "NEW_PRODUCT_REVIEW" }),
    ]);

    res.json({
      devices,
      heroSlides,
      reviews,
      pendingReviews,
      sellRequests,
      users,
      orders,
      pendingProductReviews,
      unreadNotifications,
      unreadNewUsers,
      unreadNewOrders,
      unreadNewSellRequests,
      unreadNewReviews,
      unreadNewProductReviews,
    });
  } catch (err) {
    next(err);
  }
}
