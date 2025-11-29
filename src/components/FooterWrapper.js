/*
 * File: src/components/FooterWrapper.js
 * SR-DEV: Conditional Footer Renderer
 */

"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  // Routes where the footer should be HIDDEN
  // We hide it on Auth pages to reduce distraction
  // We hide it on Chat/Video pages to maximize screen real estate
  const hideFooterRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/otp",
    "/chat",
    "/video-call", 
  ];

  // Check if current path starts with any of the hidden routes
  // Using startsWith allows us to match dynamic routes like /video-call/123
  const shouldHide = hideFooterRoutes.some((route) => pathname?.startsWith(route));

  if (shouldHide) return null;

  return <Footer />;
}