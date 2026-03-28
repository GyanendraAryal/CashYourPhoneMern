import mongoose from "mongoose";

/**
 * Phase 3: Audit logs for admin actions
 * Purpose: traceability, rollback investigation, operational safety.
 */
const AuditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    actorEmail: { type: String, default: "", index: true },
    actorRole: { type: String, default: "", index: true },

    action: { type: String, required: true, index: true }, // e.g. "device.update"
    method: { type: String, default: "", index: true },
    path: { type: String, default: "", index: true },

    entityType: { type: String, default: "", index: true }, // "device", "order"
    entityId: { type: String, default: "", index: true },

    // Minimal payload capture (avoid storing secrets)
    body: { type: Object, default: null },

    statusCode: { type: Number, default: 0, index: true },

    requestId: { type: String, default: "", index: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export default mongoose.model("AuditLog", AuditLogSchema);
