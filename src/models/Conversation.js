/*
 * File: src/models/Conversation.js
 * SR-DEV: Production-Grade Conversation Schema
 */

import mongoose, { Schema } from "mongoose";

const ConversationSchema = new Schema(
  {
    // --- Participants ---
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
      index: true,
    },

    // --- Preview Data (For Chat List Performance) ---
    // We duplicate the last message here to avoid expensive joins/lookups
    // just to render the inbox list.
    lastMessage: {
      type: String,
      default: null,
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageSender: {
      type: Schema.Types.ObjectId, // ID of who sent the last text
      default: null,
    },
    lastMessageStatus: {
      type: String,
      enum: ["sending", "sent", "delivered", "read"],
      default: "sent",
    },

    // --- Unread Counters ---
    userUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expertUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Status ---
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchivedByUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// --- INDEXES ---

// 1. Uniqueness: One chat per User-Expert pair
ConversationSchema.index({ userId: 1, expertId: 1 }, { unique: true });

// 2. Sorting: Fast retrieval of inbox sorted by recent activity
ConversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);

export default Conversation;