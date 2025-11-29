/*
 * File: src/components/ThemeContextWrapper.js
 * SR-DEV: Client Component Wrapper for next-themes ThemeProvider.
 * ACTION: Removed redundant 'mounted' check since the component is now correctly placed inside <body>.
 */
"use client";

import { ThemeProvider } from "next-themes";

export default function ThemeContextWrapper({ children }) {
  // Note: The direct placement inside <body> in layout.js fixes the script errors (2, 3, 4).
  // The ThemeProvider component handles the remaining client-side logic itself.

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}