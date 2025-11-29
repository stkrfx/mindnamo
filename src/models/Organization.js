/*
 * File: src/models/Organization.js
 * SR-DEV: Database Model for Partner Organizations.
 * Supports organization profile pages and expert affiliation.
 */

import mongoose, { Schema } from "mongoose";

const OrganizationSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      unique: true,
    },
    // Used for clean URLs (e.g., /organizations/techcorp-wellness)
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    mission: {
      type: String,
      maxlength: [1000, "Mission cannot exceed 1000 characters"],
    },
    // Optional: Video about the partnership or mission
    videoUrl: {
      type: String,
      trim: true,
    },
    // Tags like 'Corporate Wellness', 'Student Counseling'
    focusTags: [String],

    // Relationship: List of affiliated Expert IDs
    affiliatedExperts: [{
      type: Schema.Types.ObjectId,
      ref: "Expert",
    }],
    
    // Custom pricing information (e.g., 'Subsidized', 'Free for Employees')
    sessionPriceInfo: {
      type: String,
      default: "Standard pricing applies",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    minimize: true,
  }
);

const Organization =
  mongoose.models.Organization || mongoose.model("Organization", OrganizationSchema);

export default Organization;