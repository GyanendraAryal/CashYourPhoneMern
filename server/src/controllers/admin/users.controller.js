import User from "../../models/User.js";
import Order from "../../models/Order.js";
import { escapeRegex, tokenizeQuery } from "../../utils/search.js";

//GET /api/admin/users
// * Query:
// - q: search (name/email/phone)
// - page: 1-based
// - limit: default 20 (max 100)
export async function listUsers(req, res, next) {
  try {
    const qRaw = (req.query.q || "").toString().trim().slice(0, 80);
    const tokens = tokenizeQuery(qRaw, { maxTokens: 5, maxLen: 80 });
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(100, Math.max(1, isNaN(limitRaw) ? 20 : limitRaw));
    const skip = (page - 1) * limit;

    const filter = {};
    if (tokens.length) {
      filter.$and = tokens.map((t) => {
        const rx = new RegExp(escapeRegex(t), "i");
        return { $or: [{ name: rx }, { email: rx }, { phone: rx }] };
      });
    }

    // IMPORTANT: never return passwordHash / refreshTokens
    const projection = {
      name: 1,
      email: 1,
      phone: 1,
      role: 1,
      isVerified: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    const [items, total] = await Promise.all([
      User.find(filter)
        .select(projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      items: items.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email || null,
        phone: u.phone || null,
        role: u.role,
        isVerified: Boolean(u.isVerified),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/admin/users/:id
 * Returns safe user profile + order summary
 */
export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    const projection = {
      name: 1,
      email: 1,
      phone: 1,
      role: 1,
      isVerified: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    const user = await User.findById(id).select(projection).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // Order summary (derived)
    const [ordersCountAgg, lastOrderAgg, totalSpentAgg, recentOrders] = await Promise.all([
      Order.countDocuments({ user: user._id }),
      Order.findOne({ user: user._id }).sort({ createdAt: -1 }).select({ createdAt: 1 }).lean(),
      Order.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: "$user", totalSpent: { $sum: "$total" } } },
      ]),
      Order.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select({ orderNumber: 1, total: 1, status: 1, paymentStatus: 1, createdAt: 1 })
        .lean(),
    ]);

    const totalSpent = Array.isArray(totalSpentAgg) && totalSpentAgg[0]?.totalSpent
      ? Number(totalSpentAgg[0].totalSpent)
      : 0;

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        phone: user.phone || null,
        role: user.role,
        isVerified: Boolean(user.isVerified),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      orders: {
        count: ordersCountAgg,
        lastOrderAt: lastOrderAgg?.createdAt || null,
        totalSpent,
        recent: recentOrders.map((o) => ({
          id: o._id,
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
}
