/*
 * File: src/lib/session.js
 * SR-DEV: NextAuth Session Sync Helper
 * Allows client components to trigger a session update after a Server Action.
 */

"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";

/**
 * Custom hook to easily refresh and update the NextAuth session.
 * * @returns {function(Object): Promise<void>} - Function to call with new user data.
 */
export const useSessionUpdater = () => {
  const { update } = useSession();

  /**
   * @param {Object} newUserData - The partial user data to update the session with 
   * (e.g., { name: 'New Name', image: 'new-url.jpg' }).
   */
  const updateSession = useCallback(async (newUserData) => {
    if (typeof update === 'function') {
      await update({ 
        name: newUserData.name, 
        image: newUserData.profilePicture,
        // We only pass name and image as they are the only fields reflected in the JWT token/Header
      });
    }
  }, [update]);

  return updateSession;
};