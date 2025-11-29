/*
 * File: src/actions/password.js
 * SR-DEV: Server Action for updating a logged-in user's password.
 * Security: Requires old password validation against the hash.
 */

"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function changePasswordAction(formData) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { success: false, message: "Authentication required. Please log in." };
  }

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return { success: false, message: "New password must be at least 8 characters." };
  }

  try {
    await connectToDatabase();

    // 1. Fetch user, explicitly selecting the password hash (select: false by default)
    const user = await User.findById(session.user.id).select("+password");

    if (!user) {
      // Should not happen with a valid session but handles corrupted state
      return { success: false, message: "User account data not found." };
    }
    
    // 2. Validate current password against the stored hash
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return { success: false, message: "The current password you entered is incorrect." };
    }

    // 3. Update password
    // The pre-save hook in the User model will automatically hash the newPassword string.
    user.password = newPassword; 
    await user.save();

    // 4. Invalidate cache for safety
    revalidatePath("/profile");

    return { success: true, message: "Password updated successfully." };

  } catch (error) {
    console.error("[ChangePasswordAction] Error:", error);
    return { success: false, message: "Server error occurred while updating password." };
  }
}