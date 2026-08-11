import mongoose from "mongoose";

/**
 * Shared schema options. Ported from apps/core/models.py BaseModel, which gave
 * every domain model created_at / updated_at. Mongoose `timestamps` provides
 * the same pair, mapped to the original column names so migrated documents
 * keep their history.
 */
export const baseSchemaOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      ret.id = ret._id?.toString();
      delete ret._id;
      return ret;
    },
  },
  toObject: { virtuals: true },
};

/**
 * Applies the same _id -> id rename that toJSON does, for documents fetched
 * with .lean(). Lean bypasses the transform above entirely, so list endpoints
 * would otherwise return `_id` while create/update return `id` — the client
 * would have to know which shape each route hands back.
 *
 * Also normalises populated refs, whose nested _id has the same problem.
 */
export function serialize(doc) {
  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map(serialize);
  if (doc instanceof Date || doc instanceof mongoose.Types.ObjectId) return doc;
  if (typeof doc !== "object") return doc;

  // BSON scalars must not be walked like plain objects. Decimal128 is unwrapped
  // to its string form rather than via toJSON(), which would emit
  // {$numberDecimal: "199.00"} — an object where the hydrated document's getter
  // (see models/Transaction.js) yields "199.00". Lean and non-lean reads of the
  // same field have to hand the client the same type.
  if (doc._bsontype === "Decimal128") return doc.toString();
  if (typeof doc.toJSON === "function" && doc._bsontype) return doc.toJSON();
  if (typeof doc.toObject === "function") return serialize(doc.toObject());

  const out = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key === "_id") out.id = value?.toString();
    else out[key] = serialize(value);
  }
  return out;
}

export { mongoose };
