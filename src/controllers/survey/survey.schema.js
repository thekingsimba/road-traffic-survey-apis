import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const surveySchema = new Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    startPoint: { 
      type: String, 
      required: true,
      trim: true
    },
    endPoint: { 
      type: String, 
      required: true,
      trim: true
    },
    scheduledStartTime: { 
      type: Date, 
      required: true
    },
    scheduledEndTime: { 
      type: Date, 
      required: true
    },
    actualStartTime: { 
      type: Date
    },
    actualEndTime: { 
      type: Date
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'archived'],
      default: 'inactive'
    },
    motorcycleCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    carCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    assignedAgent: { 
      type: Schema.Types.ObjectId, 
      ref: "User"
    },
    countingPost: { 
      type: String, 
      required: true,
      enum: ['start', 'end']
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
      },
    },
  }
);

// Indexes for better query performance
surveySchema.index({ _id: 1, status: 1, assignedAgent: 1 });
surveySchema.index({ scheduledEndTime: 1, status: 1 });
surveySchema.index({ createdBy: 1 });

// Virtual for total vehicle count
surveySchema.virtual('totalVehicleCount').get(function() {
  return this.motorcycleCount + this.carCount;
});

// Method to check if survey is active
surveySchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.scheduledStartTime <= now && 
         this.scheduledEndTime > now;
};

// Method to check if survey can be counted
surveySchema.methods.canBeCounted = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.scheduledStartTime <= now && 
         this.scheduledEndTime > now;
};

surveySchema.plugin(mongoosePaginate);

export const Survey = model("Survey", surveySchema);
