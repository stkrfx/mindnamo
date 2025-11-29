/*
 * File: src/app/chat/page.js
 * SR-DEV: User Chat Page Wrapper
 * * FEATURES:
 * - Full-viewport height layout (h-[100dvh]) for app-like feel.
 * - Server-side conversation pre-fetching.
 * - Suspense boundary for loading states.
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getConversations } from "@/actions/chat";
import ChatClient from "./ChatClient";
import Loading from "./loading";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Messages | Mind Namo",
  description: "Secure, private conversations with your experts.",
};

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/chat");
  }

  // Fetch initial list of chats
  const conversations = await getConversations();

  return (
    // Use h-[100dvh] to match exact visible mobile screen height
    // overflow-hidden prevents the outer page from scrolling
    <div className="flex h-[100dvh] flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <main className="flex-1 overflow-hidden flex flex-col">
        <Suspense fallback={<Loading />}>
          <ChatClient 
            initialConversations={conversations} 
            currentUser={session.user} 
          />
        </Suspense>
      </main>
    </div>
  );
}