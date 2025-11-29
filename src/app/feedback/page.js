/*
 * File: src/app/feedback/page.js
 * SR-DEV: Feedback Submission Page Wrapper (Server Component)
 * Purpose: Allows users to submit structured feedback on the platform.
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import FeedbackClient from "./FeedbackClient";
import { Loader2Icon } from "@/components/Icons";
import { MessageCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Give Feedback | Mind Namo",
  description: "Share your thoughts and help us improve the Mind Namo platform.",
};

function FeedbackLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2Icon className="h-10 w-10 animate-spin text-zinc-300" />
      <p className="text-sm text-zinc-500 font-medium">Loading feedback form...</p>
    </div>
  );
}

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // Authenticated users get personalized feedback options; anonymous users should log in or see a public form.
    // For this scope, we require login.
    redirect("/login?callbackUrl=/feedback");
  }

  return (
    <div className="flex flex-col w-full bg-zinc-50 dark:bg-zinc-950 min-h-[90dvh]">
      <main className="container mx-auto max-w-3xl px-4 py-12 flex-1">
        
        <div className="mb-8 text-center space-y-2">
            <MessageCircle className="w-8 h-8 text-primary mx-auto" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Your Feedback Matters
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
                Help us build a better wellness platform for everyone. We read every submission.
            </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
            <Suspense fallback={<FeedbackLoading />}>
                <FeedbackClient userId={session.user.id} userName={session.user.name} />
            </Suspense>
        </div>

      </main>
    </div>
  );
}