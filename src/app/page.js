/*
 * File: src/app/page.js
 * SR-DEV: Home Page (Final Assembly)
 * ACTION: REMOVED FeaturedExperts section (111) and replaced it with a direct CTA to the full experts list.
 */

import { Suspense } from "react";
import HeroSection from "@/components/home/HeroSection";
import TrustBanner from "@/components/home/TrustBanner";
// Removed: FeaturedExperts and FeaturedExpertsSkeleton
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsSection from "@/components/home/StatsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";
import { Button } from "@/components/ui/button"; // Imported to use in the callout

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white dark:bg-zinc-950">
      <main className="flex-1">
        {/* 1. Hero: First Impression */}
        <HeroSection />
        
        {/* 2. Trust: Credibility Bar */}
        <TrustBanner />

        {/* 3. Features: Why Us */}
        <FeaturesSection />
        
        {/* 4. New: Callout to Full Experts List (Replaces Featured Experts) */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center bg-zinc-50 dark:bg-zinc-950">
            <div className="text-center mb-12 space-y-4 max-w-2xl mx-auto">
               <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
                 Find the Expert who truly gets you.
               </h2>
               <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                 We believe in choice, not bias. Explore our complete, unranked directory to find the perfect professional based on your specific needs.
               </p>
               <a href="/experts">
                  <Button size="lg" className="h-12 px-8 mt-4 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-md hover:shadow-lg">Browse All Experts</Button>
               </a>
            </div>
        </section>

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