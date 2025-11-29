/*
 * File: src/components/AuthProvider.js
 * SR-DEV: Authentication Context Provider
 * FIX: Accepts 'session' prop to hydrate auth state instantly from the server.
 */

"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}