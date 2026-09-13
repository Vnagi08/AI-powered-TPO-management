import type { Schema } from "mongoose";

/**
 * Applied globally (see connection.ts) so every model's JSON responses use a
 * plain `id` string instead of Mongoose's `_id`/`__v` — keeps API responses
 * consistent without every controller having its own ad-hoc mapper.
 */
export function toJSONPlugin(schema: Schema): void {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  });
}
