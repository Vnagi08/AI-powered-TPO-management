import { Schema, model } from "mongoose";

const applicationEventSchema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    fromStatus: { type: String },
    toStatus: { type: String, required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ApplicationEvent = model("ApplicationEvent", applicationEventSchema);
