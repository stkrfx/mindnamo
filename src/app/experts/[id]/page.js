/*
 * File: src/app/experts/[id]/page.js
 * SR-DEV: Expert Profile Server Wrapper
 * UPDATES: Added generateMetadata for SEO.
 */

import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";
import { notFound } from "next/navigation";
import ExpertProfileClient from "@/components/ExpertProfileClient";

// Force dynamic rendering since this depends on route params
export const dynamic = 'force-dynamic';

// Helper to fetch expert safely
async function getExpertById(id) {
  // Validate MongoDB ObjectId format to prevent casting errors
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) return null;
  
  try {
    await connectToDatabase();
    const expert = await Expert.findById(id).lean();
    
    if (!expert) return null;
    
    // Serialize MongoDB objects (Ids, Dates) to simple strings for React
    return JSON.parse(JSON.stringify({
      ...expert,
      _id: expert._id.toString(),
    }));
  } catch (error) {
    console.error("[ExpertProfilePage] Error fetching expert:", error);
    return null;
  }
}

// 1. Dynamic SEO Metadata
export async function generateMetadata({ params }) {
  // Await params for Next.js 15+ compatibility
  const { id } = await params;
  const expert = await getExpertById(id);

  if (!expert) {
    return { title: "Expert Not Found" };
  }

  return {
    title: `${expert.name} - ${expert.specialization} | Mind Namo`,
    description: expert.bio?.slice(0, 160) || `Book a session with ${expert.name}, a certified ${expert.specialization}.`,
    openGraph: {
      title: `Consult ${expert.name} on Mind Namo`,
      description: `Expert in ${expert.specialization}. ${expert.experienceYears}+ years experience.`,
      images: [expert.profilePicture || "/og-image.jpg"],
    },
  };
}

// 2. Main Page Component
export default async function ExpertProfilePage({ params }) {
  // Await params for Next.js 15+ compatibility
  const { id } = await params;
  const expert = await getExpertById(id);

  if (!expert) {
    notFound(); // Renders the global not-found.js
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* The Client Component handles all interactivity (Tabs, Booking, Video Modal).
        We pass the initial data as a prop.
      */}
      <ExpertProfileClient expert={expert} />
    </div>
  );
}