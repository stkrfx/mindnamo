import mongoose, { Schema } from "mongoose";

// --- SUB-SCHEMAS ---

const DocumentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  type: { type: String, required: true, enum: ["image", "pdf"] },
});

const ReviewSchema = new Schema({
  reviewerName: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  tags: [String], // e.g., ["Listener", "Empathy"]
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  date: { type: Date, default: Date.now },
});

const ServiceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 15 }, // in minutes
  videoPrice: { type: Number, min: 0 }, // Null if not offered
  clinicPrice: { type: Number, min: 0 }, // Null if not offered
});

const AvailabilitySlotSchema = new Schema(
  {
    dayOfWeek: { type: String, required: true }, // e.g., "Monday"
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "17:00"
  },
  { _id: false }
);

const LeaveSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, default: "Personal" },
  },
  { _id: false }
);

// --- RICH PROFILE SCHEMAS ---

const AwardSchema = new Schema({
  title: { type: String, required: true },
  year: { type: Number },
  documentUrl: { type: String }, // Link to certificate
});

const RegistrationSchema = new Schema({
  registrationNumber: { type: String, required: true },
  council: { type: String, required: true },
  year: { type: Number },
  documentUrl: { type: String }, // Link to license
});

const ClinicSchema = new Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  images: [String], // Clinic photos
  timings: { type: String }, // e.g. "Mon-Sat: 10am-7pm"
  mapUrl: { type: String },
});

const ExperienceSchema = new Schema({
  role: { type: String, required: true, trim: true },
  hospital: { type: String, required: true, trim: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number }, // Null for "Present"
  documentUrl: { type: String }, // Link to experience letter
});

const FaqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

// --- MAIN SCHEMA ---

const ExpertSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, trim: true, sparse: true }, // @handle
    email: { type: String, required: true, unique: true, lowercase: true },
    
    // Media
    profilePicture: { type: String },
    videoUrl: { type: String }, // Intro video (YouTube/Vimeo/S3)
    
    // Professional Info
    specialization: { type: String, required: true, trim: true },
    bio: { type: String, maxlength: 5000 },
    experienceYears: { type: Number, required: true, min: 0 },
    education: { type: String, required: true },
    location: { type: String, required: true }, // City, Country
    languages: { type: [String], default: ["English"] },
    gender: { type: String, enum: ["Male", "Female", "Non-Binary", "Prefer not to say"] },
    
    // Stats & Verification
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    treatmentTags: [String], // Keywords for search (e.g. "Anxiety", "Sleep")

    // --- Rich Data Sections ---
    clinics: [ClinicSchema],
    workExperience: [ExperienceSchema],
    awards: [AwardSchema],
    memberships: [String],
    registrations: [RegistrationSchema],
    faqs: [FaqSchema],

    // --- Core Functionality ---
    documents: [DocumentSchema], // Public documents for trust
    reviews: [ReviewSchema],
    services: [ServiceSchema],
    availability: [AvailabilitySlotSchema],
    leaves: { type: [LeaveSchema], default: [] },
    
    // --- Meta & State ---
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
    isBanned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    minimize: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Calculate the lowest starting price for display cards
ExpertSchema.virtual("startingPrice").get(function () {
  if (!this.services || this.services.length === 0) return 0;
  
  return this.services.reduce((min, s) => {
    const vPrice = s.videoPrice ?? Infinity;
    const cPrice = s.clinicPrice ?? Infinity;
    return Math.min(min, vPrice, cPrice);
  }, Infinity) || 0;
});

const Expert = mongoose.models.Expert || mongoose.model("Expert", ExpertSchema);

export default Expert;