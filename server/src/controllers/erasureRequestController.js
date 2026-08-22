import { serialize } from "../models/base.js";
import { DataErasureRequest } from "../models/DataErasureRequest.js";

export async function list(_req, res) {
  const items = await DataErasureRequest.find().sort({ created_at: -1 }).lean();
  res.json({ items: serialize(items), total: items.length });
}

export const erasureRequestController = { list };
