import AuditLog from "../../models/AuditLog.js";
import asyncHandler from "../../utils/asyncHandler.js";

/**
 * GET /api/admin/audit-logs
 * Query: page, limit, actor, action, entityType, entityId
 */
export const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
  const skip = (page - 1) * limit;

  const q = {};

  if (req.query.actor) q.actor = req.query.actor;
  if (req.query.action) q.action = String(req.query.action);
  if (req.query.entityType) q.entityType = String(req.query.entityType);
  if (req.query.entityId) q.entityId = String(req.query.entityId);

  const [items, total] = await Promise.all([
    AuditLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(q),
  ]);

  return res.json({
    ok: true,
    data: items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
