/*
 * File: src/components/home/FeaturedExperts.js
 * SR-DEV: Server Component for fetching experts
 * Features:
 * - Direct DB Query (Server Component)
 * - Filtering for "Verified" & "High Rating"
 * - JSON Serialization for Client Components
 */

import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";
import ExpertCard from "@/components/ExpertCard";
import { AlertCircle } from "lucide-react";

export default async function FeaturedExperts() {
  try {
    await connectToDatabase();

    // Fetch top 3 verified experts sorted by rating
    // Using lean() for performance (returns POJOs instead of Mongoose Documents)
    const experts = await Expert.find({ 
      isVerified: true,
      // Optional: Add more filters like 'isOnline' or specific categories if needed
    })
    .sort({ rating: -1, reviewCount: -1 })
    .limit(3)
    .lean();

    // Serialize ObjectIds and Dates to strings to avoid React warnings
    const plainExperts = JSON.parse(JSON.stringify(experts));

    if (plainExperts.length === 0) {
      return (
        <div className="mt-12 flex flex-col items-center justify-center p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
             <AlertCircle className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            No experts available at the moment.
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            Check back later or browse our full directory.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {plainExperts.map((expert) => (
          <ExpertCard key={expert._id} expert={expert} />
        ))}
      </div>
    );

  } catch (error) {
    console.error("[FeaturedExperts] Error fetching experts:", error);
    return (
      <div className="mt-12 text-center p-8 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400">
        <p>Unable to load experts. Please try refreshing the page.</p>
      </div>
    );
  }
}