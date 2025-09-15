import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const surveySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startPoint: {
      type: String,
      required: true,
      trim: true,
    },
    endPoint: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledStartTime: {
      type: Date,
      required: true,
    },
    scheduledEndTime: {
      type: Date,
      required: true,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived", "terminated"],
      default: "inactive",
    },
    motorcycleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    carCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    truckCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    busCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pedestrianCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startPointAgent: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    endPointAgent: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startPointSubmitted: {
      type: Boolean,
      default: false,
    },
    endPointSubmitted: {
      type: Boolean,
      default: false,
    },
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
surveySchema.index({ _id: 1, status: 1, startPointAgent: 1 });
surveySchema.index({ _id: 1, status: 1, endPointAgent: 1 });
surveySchema.index({ scheduledEndTime: 1, status: 1 });
surveySchema.index({ createdBy: 1 });

// Virtual for total vehicle count
surveySchema.virtual("totalVehicleCount").get(function () {
  return (
    this.motorcycleCount +
    this.carCount +
    this.truckCount +
    this.busCount +
    this.pedestrianCount
  );
});

// Method to check if survey is active (either manually active, within scheduled time window, or submitted)
surveySchema.methods.isActive = function () {
  const now = new Date();
  // Survey is active if:
  // 1. Status is 'active' AND within scheduled time window, OR
  // 2. Status is 'inactive' BUT current time is within scheduled time window (auto-activation), OR
  // 3. Survey has been submitted (either start or end point)
  return (
    (this.status === "active" &&
      this.scheduledStartTime <= now &&
      this.scheduledEndTime > now) ||
    (this.status === "inactive" &&
      this.scheduledStartTime <= now &&
      this.scheduledEndTime > now) ||
    this.startPointSubmitted ||
    this.endPointSubmitted
  );
};

// Method to check if survey can be counted
surveySchema.methods.canBeCounted = function () {
  const now = new Date();
  // Survey can be counted if:
  // 1. Status is 'active' AND within scheduled time window, OR
  // 2. Status is 'inactive' BUT current time is within scheduled time window (auto-activation), OR
  // 3. Survey has been submitted (either start or end point)
  return (
    (this.status === "active" &&
      this.scheduledStartTime <= now &&
      this.scheduledEndTime > now) ||
    (this.status === "inactive" &&
      this.scheduledStartTime <= now &&
      this.scheduledEndTime > now) ||
    this.startPointSubmitted ||
    this.endPointSubmitted
  );
};

// Method to get effective status (considers time-based activation and submission status)
surveySchema.methods.getEffectiveStatus = function () {
  const now = new Date();
  const isWithinTimeWindow =
    this.scheduledStartTime <= now && this.scheduledEndTime > now;

  if (this.status === "archived") {
    return "archived";
  }

  if (this.status === "terminated") {
    return "terminated";
  }

  // If survey has been submitted (either start or end point), show as active
  if (this.startPointSubmitted || this.endPointSubmitted) {
    return "active";
  }

  if (isWithinTimeWindow) {
    return "active";
  }

  return "inactive";
};

surveySchema.plugin(mongoosePaginate);

export const Survey = model("Survey", surveySchema);
