/*
 * File: src/models/Message.js
 * SR-DEV: Production-Grade Message Schema
 *
 * Best Practices Applied:
 * 1. Polymorphism: 'sender' field dynamically references User or Expert models.
 * 2. Indexing: Optimized for pagination (fetching history by conversation + time).
 * 3. Soft Deletes: 'isDeleted' flag allows UI to show "Message deleted" placeholders.
 */

import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true, // Crucial for grouping messages
    },
    
    // --- Polymorphic Sender ---
    // Allows us to store IDs from two different collections in one field
    // refPath tells Mongoose which model to use based on the value of 'senderModel'
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel",
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["User", "Expert"],
    },

    // --- Content ---
    content: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      enum: ["text", "image", "audio", "pdf"],
      default: "text",
    },
    
    // --- Features ---
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    
    // List of IDs who have read this message
    // Used to calculate Blue Ticks (if readBy.length > 1)
    readBy: [{
      type: Schema.Types.ObjectId,
    }],

    // --- Audit ---
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    minimize: true,
  }
);

// --- CRITICAL INDEX ---
// This enables O(log n) retrieval of chat history sorted by time.
// Usage: Message.find({ conversationId: ... }).sort({ createdAt: 1 })
MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default Message;