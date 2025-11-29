/*
 * File: src/app/experts/page.js
 * SR-DEV: Experts Page Container
 * Fetches initial expert data on the server and hydrates the client search interface.
 */

import { Suspense } from "react";
import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";
import ExpertSearchClient from "@/components/ExpertSearchClient";
import Loading from "./loading";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Find Experts | Mind Namo",
  description: "Browse certified psychologists, therapists, and life coaches. Filter by specialization, price, and language.",
};

async function getAllExperts() {
  try {
    await connectToDatabase();
    
    // Fetch all verified experts initially
    // In a real app with thousands of users, we would implement cursor-based pagination here.
    // For this scope, fetching all (e.g. <100) is performant and allows instant client-side filtering.
    const experts = await Expert.find({ 
      isVerified: true,
      isBanned: false 
    })
    .select("-leaves -availability") // Exclude heavy arrays not needed for the card view
    .sort({ rating: -1, reviewCount: -1 }) // Default sort: Best rated
    .lean();

    return JSON.parse(JSON.stringify(experts));
  } catch (error) {
    console.error("[ExpertsPage] Error:", error);
    return [];
  }
}

export default async function ExpertsPage() {
  const experts = await getAllExperts();

  return (
    <div className="flex flex-col w-full bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      {/* We add a top padding to account for the fixed header 
        and some breathing room for the title.
      */}
      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12 flex-1">
        
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Find your perfect match
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Connect with verified professionals who specialize in your needs. 
            Use filters to narrow down by expertise, language, or price.
          </p>
        </div>

        <Suspense fallback={<Loading />}>
          <ExpertSearchClient initialExperts={experts} />
        </Suspense>

      </main>
    </div>
  );
}