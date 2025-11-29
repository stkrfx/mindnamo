/*
 * File: src/app/profile/page.js
 * SR-DEV: User Profile Page (Server Component)
 * Securely fetches user data and renders the settings form.
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getUser } from "@/actions/user";
import UserProfileForm from "@/components/UserProfileForm";
import { Loader2Icon } from "@/components/Icons";

export const metadata = {
  title: "Account Settings | Mind Namo",
  description: "Manage your profile details and preferences.",
};

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <Loader2Icon className="h-10 w-10 animate-spin text-zinc-300" />
      <p className="text-sm text-zinc-500">Loading profile...</p>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const result = await getUser();

  // Handle edge case where user exists in session token but not DB (e.g. deleted/banned)
  if (!result.success) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-zinc-50/50 dark:bg-zinc-950">
      <main className="container mx-auto max-w-4xl px-4 md:px-8 py-12 flex-1">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Account Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Manage your personal information and notification preferences.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <Suspense fallback={<Loading />}>
            <UserProfileForm user={result.user} />
          </Suspense>
        </div>

      </main>
    </div>
  );
}