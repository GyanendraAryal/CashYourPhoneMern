import mongoose from "mongoose";
import SellRequest from "../../models/SellRequest.js";

/**
 * @desc List all sell requests with pagination and filtering
 * @route GET /api/admin/sell-requests
 * @access Admin
 */
export const list = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, sort = "-createdAt" } = req.query;

    //FIX: include docs where isDeleted is false OR missing (old records)
    const filter = { isDeleted: { $ne: true } };

    const allowedSorts = new Set(["-createdAt", "createdAt"]);
    const safeSort = allowedSorts.has(String(sort)) ? String(sort) : "-createdAt";
    if (status) filter.status = status;

    const total = await SellRequest.countDocuments(filter);

    const items = await SellRequest.find(filter)
      .sort(safeSort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      items,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get a single sell request by ID
 * @route GET /api/admin/sell-requests/:id
 * @access Admin
 */
export const getOne = async (req, res, next) => {
  try {
    //FIX: don't allow reading deleted items

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid sell request id" });
    }
    const item = await SellRequest.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!item) {
      return res.status(404).json({ message: "Sell request not found" });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Update sell request status
 * @route PATCH /api/admin/sell-requests/:id/status
 * @access Admin
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const validStatuses = ["new", "contacted", "closed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of new, contacted, closed.",
      });
    }

    //FIX: don't allow updating deleted items

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid sell request id" });
    }
    const item = await SellRequest.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!item) {
      return res.status(404).json({ message: "Sell request not found" });
    }

    item.status = status;
    await item.save();

    res.json({
      message: `Sell request marked as ${status}`,
      item,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Soft delete sell request
 * @route DELETE /api/admin/sell-requests/:id
 * @access Admin
 */
export const remove = async (req, res, next) => {
  try {
    //FIX: don't delete already-deleted items (and supports old docs)
    const item = await SellRequest.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!item) {
      return res.status(404).json({ message: "Sell request not found" });
    }

    item.isDeleted = true;
    await item.save();

    res.json({ message: "Sell request deleted successfully" });
  } catch (err) {
    next(err);
  }
};