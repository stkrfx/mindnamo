/*
 * File: src/app/page.js
 * SR-DEV: Home Page (Final Assembly)
 * Features:
 * - Hero with CTA
 * - Trust Signals
 * - Featured Experts (Server Component with Suspense)
 * - How it Works
 * - Stats & Social Proof
 * - FAQ & Final CTA
 */

import { Suspense } from "react";
import HeroSection from "@/components/home/HeroSection";
import TrustBanner from "@/components/home/TrustBanner";
import FeaturedExperts from "@/components/home/FeaturedExperts";
import FeaturedExpertsSkeleton from "@/components/home/FeaturedExpertsSkeleton";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsSection from "@/components/home/StatsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white dark:bg-zinc-950">
      <main className="flex-1">
        {/* 1. Hero: First Impression */}
        <HeroSection />
        
        {/* 2. Trust: Credibility Bar */}
        <TrustBanner />

        {/* 3. Featured Experts: Immediate Value */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12 space-y-4">
             <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
               Meet Our Top Experts
             </h2>
             <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
               Highly rated professionals ready to help you navigate life's challenges.
             </p>
          </div>
          
          {/* Streaming Server Component */}
          <Suspense fallback={<FeaturedExpertsSkeleton />}>
             <FeaturedExperts />
          </Suspense>
        </section>

        {/* 4. Features: Why Us */}
        <FeaturesSection />

        {/* 5. Process: How to Book */}
        <HowItWorksSection />

        {/* 6. Stats: Scale & Trust */}
        <StatsSection />

        {/* 7. Social Proof: Reviews */}
        <TestimonialsSection />

        {/* 8. FAQ: Objection Handling */}
        <FAQSection />

        {/* 9. Bottom CTA: Conversion */}
        <CTASection />
      </main>
    </div>
  );
}