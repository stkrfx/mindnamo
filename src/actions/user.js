/*
 * File: src/actions/user.js
 * SR-DEV: User Profile Actions
 * Securely fetch and update user settings.
 */

"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Validation Schemas ---

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60).optional(),
  profilePicture: z.string().url().optional().or(z.literal("")),
  marketing: z.boolean().optional(),
  security: z.boolean().optional(),
  transactional: z.boolean().optional(),
});

/**
 * @name getUser
 * @description Fetches the current authenticated user's full profile.
 * Used for populating the Settings/Profile page form.
 */
export async function getUser() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    
    // Select specific fields (exclude password, otp, etc.)
    // We explicitly select fields to be safe
    const user = await User.findById(session.user.id)
      .select("name email profilePicture notificationPreferences isVerified isOnline")
      .lean();

    if (!user) {
      return { success: false, message: "User not found." };
    }

    // Convert _id and dates to string for serialization
    return { 
      success: true, 
      user: JSON.parse(JSON.stringify(user)) 
    };

  } catch (error) {
    console.error("[UserAction] GetUser Error:", error);
    return { success: false, message: "Failed to fetch profile." };
  }
}

/**
 * @name updateUserAction
 * @description Updates user profile details.
 * Prevents updating sensitive fields like email (which requires re-verification) or role.
 */
export async function updateUserAction(formData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, message: "Unauthorized" };
  }

  // 1. Extract Data
  const rawData = {
    name: formData.get("name"),
    profilePicture: formData.get("profilePicture"),
    marketing: formData.get("marketing") === "true",
    security: formData.get("security") === "true",
    transactional: formData.get("transactional") === "true",
  };

  // 2. Validate
  const validation = updateProfileSchema.safeParse(rawData);
  if (!validation.success) {
    return { 
      success: false, 
      message: validation.error.issues[0].message 
    };
  }

  const { name, profilePicture, marketing, security, transactional } = validation.data;

  try {
    await connectToDatabase();

    // 3. Update
    // We use dot notation for nested fields to update them individually
    // without overwriting the whole 'notificationPreferences' object if strictly needed,
    // though here we are setting all known keys.
    await User.findByIdAndUpdate(
      session.user.id,
      {
        name,
        profilePicture,
        "notificationPreferences.marketing": marketing,
        "notificationPreferences.security": security,
        "notificationPreferences.transactional": transactional,
      },
      { new: true, runValidators: true }
    );

    // 4. Revalidate Pages
    // Refresh the profile page and any layouts using the user avatar
    revalidatePath("/profile");
    revalidatePath("/", "layout"); 

    return { success: true, message: "Profile updated successfully." };

  } catch (error) {
    console.error("[UserAction] Update Error:", error);
    return { success: false, message: "Failed to update profile." };
  }
}