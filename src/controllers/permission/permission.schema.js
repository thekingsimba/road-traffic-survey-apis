import { model, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const permissionSchema = new Schema({
  name: { type: String },
  description: { type: String },
}, { timestamps: true, toJSON: {
  transform(doc, ret, options) {
    delete ret.__v
  },
}});

permissionSchema.index({ _id: 1, name: 1});
permissionSchema.plugin(mongoosePaginate);
export const Permission = model("Permission", permissionSchema);