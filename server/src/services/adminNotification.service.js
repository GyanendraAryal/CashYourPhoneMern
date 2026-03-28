import AdminNotification from "../models/AdminNotification.js";

/**
 * Create an admin notification in an idempotent way.
 * If it already exists (same type + entityId), it won't create duplicates.
 */
export async function createAdminNotification({ type, entityModel, entityId, message, session }) {
  if (!type || !entityModel || !entityId || !message) return null;

  try {
    const doc = await AdminNotification.findOneAndUpdate(
      { type: String(type).toUpperCase(), entityId },
      {
        $setOnInsert: {
          type: String(type).toUpperCase(),
          entityModel,
          entityId,
          message,
          readAt: null,
        },
      },
      { new: true, upsert: true, session }
    );
    return doc;
  } catch (err) {
    // Ignore duplicate key errors or any notification failures (never break core flows)
    if (err?.code === 11000) return null;
    return null;
  }
}
