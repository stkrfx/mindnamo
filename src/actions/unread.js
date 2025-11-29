/*
 * File: src/actions/unread.js
 * SR-DEV: Server Action to fetch the total unread message count for a user.
 * ACTION: FIXED dynamic require error by adding static mongoose import.
 */

"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Conversation from "@/models/Conversation";
import mongoose from "mongoose"; // <-- STATIC IMPORT ADDED

/**
 * @name getUnreadCountAction
 * @description Sums the unread counts across all conversations for the logged-in user.
 */
export async function getUnreadCountAction() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return 0;

    try {
        await connectToDatabase();

        const result = await Conversation.aggregate([
            // Use static mongoose import for ObjectId casting
            { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
            { $group: { _id: null, totalUnread: { $sum: "$userUnreadCount" } } }
        ]);

        return result.length > 0 ? result[0].totalUnread : 0;
    } catch (error) {
        console.error("[UnreadAction] Error fetching count:", error);
        return 0;
    }
}