import AdminNotification from "../../models/AdminNotification.js";

function clampInt(v, { min = 1, max = 200, fallback = 50 } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function normalizeType(t) {
  return String(t || "").toUpperCase().trim();
}

export async function listNotifications(req, res, next) {
  try {
    const limit = clampInt(req.query.limit, { min: 1, max: 200, fallback: 25 });
    const page = clampInt(req.query.page, { min: 1, max: 100000, fallback: 1 });

    const unreadOnly = String(req.query.unreadOnly || "").toLowerCase() === "1";
    const type = req.query.type ? normalizeType(req.query.type) : "";

    const filter = {};
    if (unreadOnly) filter.readAt = null;
    if (type) filter.type = type;

    const [items, total, unreadCount] = await Promise.all([
      AdminNotification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminNotification.countDocuments(filter),
      AdminNotification.countDocuments({ readAt: null }),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));

    res.json({ items, total, page, pages, unreadCount });
  } catch (err) {
    next(err);
  }
}

/**
 * Summary for sidebar badges / inbox counters.
 * Returns unread count total + unread per type.
 */
export async function summary(req, res, next) {
  try {
    const pipeline = [
      { $match: { readAt: null } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ];

    const rows = await AdminNotification.aggregate(pipeline);

    const unreadByType = {};
    let unreadTotal = 0;
    for (const r of rows) {
      unreadByType[String(r._id || "UNKNOWN")] = r.count;
      unreadTotal += r.count;
    }

    res.json({ unreadTotal, unreadByType });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await AdminNotification.findByIdAndUpdate(
      id,
      { $set: { readAt: new Date() } },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Notification not found" });

    const unreadCount = await AdminNotification.countDocuments({ readAt: null });

    res.json({ item: doc, unreadCount });
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk mark read by ids[]
 */
export async function markReadBulk(req, res, next) {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ message: "ids[] is required" });

    await AdminNotification.updateMany(
      { _id: { $in: ids }, readAt: null },
      { $set: { readAt: new Date() } }
    );

    const unreadCount = await AdminNotification.countDocuments({ readAt: null });
    res.json({ ok: true, unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await AdminNotification.updateMany({ readAt: null }, { $set: { readAt: new Date() } });
    res.json({ ok: true, unreadCount: 0 });
  } catch (err) {
    next(err);
  }
}

export async function markReadByType(req, res, next) {
  try {
    const typeRaw = req.body?.type;
    const typesRaw = req.body?.types;

    const types = Array.isArray(typesRaw)
      ? typesRaw.map((t) => normalizeType(t)).filter(Boolean)
      : typeRaw
      ? [normalizeType(typeRaw)].filter(Boolean)
      : [];

    if (!types.length) {
      return res.status(400).json({ message: "type (or types[]) is required" });
    }

    await AdminNotification.updateMany(
      { readAt: null, type: { $in: types } },
      { $set: { readAt: new Date() } }
    );

    const unreadCount = await AdminNotification.countDocuments({ readAt: null });

    res.json({ ok: true, unreadCount });
  } catch (err) {
    next(err);
  }
}
