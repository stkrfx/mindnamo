/*
 * File: src/models/NewsletterSubscriber.js
 * SR-DEV: Database Model for Newsletter Subscriptions.
 * Stores emails securely and includes a verification/opt-in status.
 */

import mongoose, { Schema } from "mongoose";

const NewsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    // Used for double opt-in / compliance checks
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Allows for soft-unsubscribe without immediate database removal
    isSubscribed: {
      type: Boolean,
      default: true,
    },
    // Token for single-click unsubscribe link (or future verification)
    unsubscribeToken: {
      type: String,
      select: false,
    }
  },
  {
    timestamps: true,
    minimize: true,
  }
);

// Helper method to generate a unique token (e.g. for unsubscribe link)
NewsletterSubscriberSchema.methods.generateUnsubscribeToken = function() {
    this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
    // Save token without waiting
    this.save({ validateBeforeSave: false });
    return this.unsubscribeToken;
};

const NewsletterSubscriber =
  mongoose.models.NewsletterSubscriber || mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);

export default NewsletterSubscriber;