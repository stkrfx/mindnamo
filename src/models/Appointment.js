import mongoose, { Schema } from "mongoose";

const AppointmentSchema = new Schema(
  {
    // --- Relationships ---
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Fast lookup for "My Appointments"
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
      index: true, // Fast lookup for Expert availability checks
    },

    // --- Scheduling ---
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    appointmentTime: {
      type: String, // Format: "HH:MM" (24h) e.g., "14:30"
      required: [true, "Time slot is required"],
    },

    // --- Snapshot Data (Point-in-Time) ---
    // Critical for historical accuracy & invoicing
    serviceName: {
      type: String,
      required: true,
    },
    appointmentType: {
      type: String,
      enum: ["Video Call", "Clinic Visit"],
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    price: {
      type: Number,
      required: true, // The actual amount charged
    },

    // --- Status & Lifecycle ---
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: String, // ID from Razorpay/Stripe
      trim: true,
    },

    // --- Session Details ---
    meetingLink: {
      type: String, // Generated for Video Calls
      trim: true,
    },
    whiteboardUrl: {
      type: String, // For saving session notes/drawings
    },
    notes: {
      type: String, // User's pre-session notes
      maxlength: 1000,
      trim: true,
    },

    // --- Cancellation Meta ---
    cancelledBy: {
      type: String,
      enum: ["user", "expert", "admin", null],
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// --- CRITICAL: Prevent Double Booking ---
// A unique index ensures an Expert cannot have two 'active' (pending/confirmed)
// appointments at the exact same time.
// Cancelled appointments are ignored by this index, allowing re-booking.
AppointmentSchema.index(
  { expertId: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

const Appointment =
  mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

export default Appointment;