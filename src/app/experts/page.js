/*
 * File: src/app/experts/page.js
 */

import { Suspense } from "react";
import ExpertSearchClient from "@/components/ExpertSearchClient";
import ExpertsLoading from "./loading"; 
import { getExpertsAction } from "@/actions/experts"; 
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- UPDATED METADATA ---
export const metadata = {
  title: "Experts | Mind Namo",
  description: "Browse certified psychologists, therapists, and life coaches. Filter by specialization, price, and language.",
  openGraph: {
    title: "Find Your Perfect Mental Health Expert | Mind Namo",
    description: "Connect with verified psychologists and coaches. Filter by specialization, language, and price.",
    url: "/experts",
    siteName: "Mind Namo",
    images: [
      {
        url: "/og-experts.jpg", // Make sure this image exists in /public
        width: 1200,
        height: 630,
        alt: "Mind Namo Expert Directory",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Top Mental Health Experts",
    description: "Find the right therapist for you on Mind Namo.",
    images: ["/og-experts.jpg"],
  },
};

async function getInitialData() {
  const result = await getExpertsAction({ page: 1, limit: 10, filters: {}, sort: 'recommended' });
  
  if (!result.success) {
    console.error("Failed to fetch initial expert data:", result.message);
    return {
      experts: [],
      total: 0,
      hasMore: false,
      dynamicFilters: {},
      error: result.message || "Failed to load experts."
    };
  }

  return {
    experts: result.experts,
    total: result.total,
    hasMore: result.hasMore,
    dynamicFilters: result.dynamicFilters,
    error: null,
  };
}

export default async function ExpertsPage() {
  const initialData = await getInitialData();
  
  return (
    <div className="flex flex-col w-full bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12 flex-1">
        
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Find your perfect match
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Connect with verified professionals who specialize in your needs.
          </p>
        </div>

        {initialData.error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
             <AlertTriangle className="w-8 h-8 text-red-600 mb-3" />
             <p className="text-red-700 dark:text-red-300 font-medium">Error: {initialData.error}</p>
          </div>
        ) : (
          <Suspense fallback={<ExpertsLoading />}>
            <ExpertSearchClient 
              initialExperts={initialData.experts} 
              initialTotal={initialData.total}
              initialHasMore={initialData.hasMore}
              dynamicFilters={initialData.dynamicFilters}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}