/*
 * File: src/models/EmailTemplate.js
 * SR-DEV: Dynamic Email Template Schema
 *
 * Purpose: Allows admins to edit email content via a dashboard without code changes.
 * Features:
 * - 'slug': Immutable key used by the code to find the template.
 * - 'placeholders': Documentation for admins (e.g., "Use {{name}} for user's name").
 * - 'fallback': If true, this is a system default (optional flag).
 */

import mongoose, { Schema } from "mongoose";

const EmailTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // e.g., "User Verification Email"
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // Critical for fast lookups
    },
    subject: {
      type: String,
      required: true, // e.g., "Welcome to Mind Namo! Your Code: {{otp}}"
    },
    bodyContent: {
      type: String,
      required: true, // Stores the HTML or Text with {{handlebars}} style tags
    },
    placeholders: {
      type: [String], // e.g., ["name", "otp", "link"]
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmailTemplate =
  mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", EmailTemplateSchema);

export default EmailTemplate;