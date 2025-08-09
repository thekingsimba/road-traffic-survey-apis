import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema({
  name: { type: String },
  permissions: [{
    name: { type: String},
    description: { type: String}
  }]
}, { timestamps: true });

roleSchema.index({ _id: 1, name: 1, "permissions": 1 });
export const Role = mongoose.model("Role", roleSchema);