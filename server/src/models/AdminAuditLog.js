import mongoose from "mongoose";

/**
 * Ported from apps/accounts/models.py AdminAuditLog.
 *
 * Append-only by contract: the service layer only ever inserts, and the
 * pre-update/pre-delete hooks below make accidental mutation loud rather
 * than silent. Django enforced this by convention plus PROTECT on the FK.
 */
const adminAuditLogSchema = new mongoose.Schema(
  {
    action_time: { type: Date, default: Date.now, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Denormalised so the log stays readable if the user doc is ever removed.
    username: { type: String, default: "" },
    action: { type: String, required: true, maxlength: 200 },
    object_repr: { type: String, default: "", maxlength: 200 },
    changes: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  {
    versionKey: false,
    // Django Meta.ordering = ["-action_time"]
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

adminAuditLogSchema.index({ action_time: -1 });

function blockMutation(next) {
  next(new Error("AdminAuditLog is append-only and cannot be modified or deleted"));
}

adminAuditLogSchema.pre("updateOne", blockMutation);
adminAuditLogSchema.pre("updateMany", blockMutation);
adminAuditLogSchema.pre("findOneAndUpdate", blockMutation);
adminAuditLogSchema.pre("deleteOne", blockMutation);
adminAuditLogSchema.pre("deleteMany", blockMutation);
adminAuditLogSchema.pre("findOneAndDelete", blockMutation);

export const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);
