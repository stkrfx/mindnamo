/*
 * File: src/components/UnreadChatIndicator.js
 * SR-DEV: Real-time Unread Message Counter for the Header.
 */

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { initSocket, getSocket } from '@/lib/socket-client';
import { getUnreadCountAction } from '@/actions/unread';
import { Button } from '@/components/ui/button';

export default function UnreadChatIndicator() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Fetch initial count on mount (Server Action call)
  useEffect(() => {
    const fetchInitialCount = async () => {
      const count = await getUnreadCountAction();
      setUnreadCount(count);
    };
    if (session?.user) {
      fetchInitialCount();
    }
  }, [session?.user]);

  // 2. Subscribe to real-time updates via Socket.io
  useEffect(() => {
    if (!session?.user) return;

    const connectAndSubscribe = async () => {
      const socket = await initSocket(session.user.id);
      if (!socket) return;

      const handleUpdate = (data) => {
        // If a message is sent or read, we can re-fetch the count or optimistically update.
        // For robustness, we re-fetch the aggregate sum.
        getUnreadCountAction().then(setUnreadCount);
      };

      // Subscribe to conversation updates (message sent, message read)
      socket.on('conversationUpdated', handleUpdate);
      socket.on('messagesRead', handleUpdate); 
    };

    connectAndSubscribe();

    return () => {
        const socket = getSocket();
        if(socket) {
            socket.off('conversationUpdated');
            socket.off('messagesRead');
        }
    };
  }, [session?.user]);

  if (!session?.user) return null;

  const hasUnread = unreadCount > 0;

  return (
    <Link href="/chat" className="relative">
        <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex text-muted-foreground hover:text-primary relative" 
            title={`Messages${hasUnread ? ` (${unreadCount} unread)` : ''}`}
        >
            <MessageSquare className="h-5 w-5" />
            {/* Unread Indicator (Desktop) */}
            {hasUnread && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold animate-in fade-in zoom-in-75">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Button>
    </Link>
  );
}