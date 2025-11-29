/*
 * File: src/app/profile/page.js
 * SR-DEV: Settings Page Container (Redesigned)
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getUser } from "@/actions/user";
import UserProfileTabs from "@/components/UserProfileTabs";
import { Loader2Icon } from "@/components/Icons";

export const metadata = {
  title: "Account Settings | Mind Namo",
  description: "Manage your profile details and security preferences.",
};

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2Icon className="h-10 w-10 animate-spin text-zinc-300" />
      <p className="text-sm text-zinc-500 font-medium animate-pulse">Loading settings...</p>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const result = await getUser();

  if (!result.success) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Page Content */}
      <main className="container mx-auto max-w-6xl px-4 md:px-6 py-12">
         <Suspense fallback={<Loading />}>
            <UserProfileTabs user={result.user} /> 
         </Suspense>
      </main>
    </div>
  );
}