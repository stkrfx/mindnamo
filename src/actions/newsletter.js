/*
 * File: src/actions/newsletter.js
 * SR-DEV: Server Action for Newsletter Signup
 * Handles validation and persistence of subscriber emails.
 */

"use server";

import { connectToDatabase } from "@/lib/db";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// --- Validation Schema ---
const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * @name subscribeToNewsletterAction
 * @description Adds or updates an email subscription status.
 * Note: A real app would send a double opt-in verification email here.
 */
export async function subscribeToNewsletterAction(formData) {
  const email = formData.get("email")?.toLowerCase().trim();
  
  if (!email) {
    return { success: false, message: "Email is required." };
  }

  // 1. Client-side validation check (redundant but good practice)
  const validation = newsletterSchema.safeParse({ email });
  if (!validation.success) {
    return { success: false, message: "Invalid email format." };
  }

  try {
    await connectToDatabase();

    // 2. Find and Upsert (Update if exists, Insert if new)
    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { 
        $set: { 
          isSubscribed: true,
          // In a double opt-in flow, this would remain false until clicked
          isVerified: true, 
        } 
      },
      { upsert: true, new: true, runValidators: true }
    );

    // 3. Optional: Send thank-you email (skipped for scope, but place logic here)
    // await sendEmail({ to: email, slug: 'newsletter-welcome', data: {} });

    // Revalidate the home page or footer to show updated state if needed
    revalidatePath("/"); 

    return { 
      success: true, 
      message: subscriber.isNew ? "Subscription successful!" : "You are already subscribed." 
    };

  } catch (error) {
    console.error("[NewsletterAction] Error:", error);
    if (error.code === 11000) { // MongoDB duplicate key error
      return { success: false, message: "You are already subscribed." };
    }
    return { success: false, message: "Subscription failed due to a server error." };
  }
}