/*
 * File: src/actions/chat.js
 * SR-DEV: Server Actions for Chat & Messaging
 */

"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

// IMPORTANT: Import referenced models to ensure Schemas are registered
import Expert from "@/models/Expert";
import User from "@/models/User"; 

/**
 * @name findOrCreateConversation
 * @description Finds an existing chat or creates a new one with an expert.
 * Used when the user clicks "Message" on an Expert's profile.
 */
export async function findOrCreateConversation(expertId) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, message: "Unauthorized" };
  }

  const userId = session.user.id;

  try {
    await connectToDatabase();

    // Upsert: Find one where both participants match, or create it.
    // $setOnInsert ensures we don't overwrite existing data if found.
    const conversation = await Conversation.findOneAndUpdate(
      { userId: userId, expertId: expertId },
      { 
        $setOnInsert: { 
          userId: userId, 
          expertId: expertId,
          userUnreadCount: 0,
          expertUnreadCount: 0,
          isActive: true
        } 
      },
      { new: true, upsert: true }
    );

    return { 
      success: true, 
      conversationId: conversation._id.toString() 
    };

  } catch (error) {
    console.error("[ChatAction] FindOrCreate Error:", error);
    return { success: false, message: "Failed to initialize conversation." };
  }
}

/**
 * @name getConversations
 * @description Fetches the user's inbox list.
 */
export async function getConversations() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];

  const userId = session.user.id;

  try {
    await connectToDatabase();

    // Fetch chats where user is a participant
    // Populate expert details for the list UI (Avatar, Name, Online Status)
    const conversations = await Conversation.find({ userId: userId })
      .populate({
        path: "expertId",
        select: "name profilePicture specialization isOnline lastSeen",
        model: Expert
      })
      .sort({ lastMessageAt: -1 }) // Most recent first
      .lean();

    // Serialize MongoDB objects to plain JSON
    return JSON.parse(JSON.stringify(conversations));

  } catch (error) {
    console.error("[ChatAction] GetConversations Error:", error);
    return [];
  }
}

/**
 * @name getMessages
 * @description Fetches chat history for a specific conversation.
 * Includes security check to ensure user belongs to the chat.
 */
export async function getMessages(conversationId) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];

  const userId = session.user.id;

  try {
    await connectToDatabase();

    // 1. Verify Ownership (Security)
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: userId,
    });

    if (!conversation) {
      console.warn(`[ChatAction] Unauthorized access attempt by ${userId} for chat ${conversationId}`);
      return [];
    }

    // 2. Fetch Messages
    // Populate 'replyTo' to show the original message context
    const messages = await Message.find({ conversationId: conversationId })
      .sort({ createdAt: 1 }) // Oldest first (for chronological chat)
      .populate({
        path: "replyTo",
        select: "content contentType senderModel",
        model: Message
      })
      .lean();

    return JSON.parse(JSON.stringify(messages));

  } catch (error) {
    console.error("[ChatAction] GetMessages Error:", error);
    return [];
  }
}