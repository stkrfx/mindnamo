/*
 * File: src/app/experts/layout.js
 * SR-DEV: Dedicated layout for the Expert Search page.
 * Purpose: Overrides the root layout to prevent the footer from rendering.
 */

export default function ExpertsLayout({ children }) {
    return (
      // The main content area of the experts page is rendered here.
      // By wrapping it, we bypass the need for a FooterWrapper check inside the page itself,
      // although the FooterWrapper already handles it via path. This ensures a clean boundary.
      <div className="flex flex-col flex-1 min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
        {children}
      </div>
    );
  }