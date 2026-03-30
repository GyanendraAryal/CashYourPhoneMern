import * as deviceService from "./device.service.js";
import { toPublicUploadUrl } from "../../utils/upload.js";

const resolveDeviceUrls = (req, d) => {
  if (!d) return d;
  const doc = d.toObject ? d.toObject() : d;
  
  return {
    ...doc,
    thumbnail: toPublicUploadUrl(req, doc.thumbnail),
    images: Array.isArray(doc.images) 
      ? doc.images.map(img => toPublicUploadUrl(req, img)).filter(Boolean)
      : []
  };
};

// Public Controllers
export const listDevices = async (req, res, next) => {
  try {
    const isAuthed = Boolean(req.user?.id || req.admin?.id);
    const result = await deviceService.queryDevices(req.query, isAuthed);
    
    // Normalize images
    if (result.items) {
      result.items = result.items.map(it => resolveDeviceUrls(req, it));
    }

    res.status(200).json({ status: "success", ...result });
  } catch (err) {
    next(err);
  }
};

export const getDevice = async (req, res, next) => {
  try {
    const isAuthed = Boolean(req.user?.id || req.admin?.id);
    const device = await deviceService.getDeviceById(req.params.id, isAuthed);
    res.status(200).json({ status: "success", data: resolveDeviceUrls(req, device) });
  } catch (err) {
    next(err);
  }
};

// Admin Controllers
export const createDevice = async (req, res, next) => {
  try {
    const device = await deviceService.createDevice(req.body, req.files);
    res.status(201).json({ status: "success", data: resolveDeviceUrls(req, device) });
  } catch (err) {
    next(err);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const device = await deviceService.updateDevice(req.params.id, req.body, req.files);
    res.status(200).json({ status: "success", data: resolveDeviceUrls(req, device) });
  } catch (err) {
    next(err);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    await deviceService.deleteDevice(req.params.id);
    res.status(200).json({ status: "success", message: "Device deleted" });
  } catch (err) {
    next(err);
  }
};
export const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await deviceService.getSimilarDevices(req.params.id);
    const normalized = recommendations.map(r => resolveDeviceUrls(req, r));
    res.status(200).json({ status: "success", data: normalized });
  } catch (err) {
    next(err);
  }
};
