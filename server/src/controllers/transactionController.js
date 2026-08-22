import { serialize } from "../models/base.js";
import { Transaction } from "../models/Transaction.js";

export async function list(req, res) {
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const [items, total] = await Promise.all([
    Transaction.find().sort({ created_at: -1 }).limit(limit).lean(),
    Transaction.countDocuments(),
  ]);
  res.json({ items: serialize(items), total });
}

export const transactionController = { list };
