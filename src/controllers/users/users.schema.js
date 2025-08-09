import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const userSchema = new Schema({
  full_name: { type: String },
  email: { type: String },
  phone: { type: String },
  picture: { type: String },
  password: { type: String },
  verification_code: { type: String },
  otp_expires: { type: Date },
  phone_verified: { type: Boolean, default: false },
  role: { type: Schema.Types.ObjectId, ref: "Role" },
  reset_password_otp: { type: Number },
  resetPasswordExpires: { type: Date }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret.password;
      delete ret.__v;
    }
  }
});

userSchema.plugin(mongoosePaginate);
userSchema.index({ _id: 1, phone: 1, email: 1, full_name: 1, });

export const User = model("User", userSchema);