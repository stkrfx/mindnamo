/*
 * File: src/app/chat/ChatClient.js
 * SR-DEV: Premium User Chat UI - Final Production Version
 * ACTION: FIXED ReferenceError by importing disconnectSocket (124).
 */

"use client";

import { useState, useEffect, useRef, useTransition, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import ProfileImage from "@/components/ProfileImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages } from "@/actions/chat";
import { initSocket, disconnectSocket, getSocket } from "@/lib/socket-client"; // <-- ADDED disconnectSocket
import { useUploadThing } from "@/lib/uploadthing";
import ChatMessages from "@/components/chat/ChatMessages"; // **NEW IMPORT (File 135)**
import { format } from "date-fns";

// --- Icons ---
import { 
  Send, Mic, Paperclip, Smile, MoreVertical, Phone, Video, 
  ChevronLeft, Loader2, MessageSquare, AlertTriangle
} from "lucide-react";

// --- CORE COMPONENT ---

export default function ChatClient({ initialConversations, currentUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  
  // State
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!selectedId); // Mobile toggle
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Loading States
  const [isHistoryLoading, startHistoryTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // File Upload Hook
  const { startUpload } = useUploadThing("chatAttachment", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        // Simple logic: determine file type for preview text
        const fileType = res[0].key.split('.').pop();
        const contentType = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType.toLowerCase()) ? 'image' : 'pdf';

        sendMessage(contentType, res[0].url);
      }
      setIsUploading(false);
    },
    onUploadError: () => {
      setIsUploading(false);
      toast.error("Upload failed.", { description: "Max size exceeded or file type not supported." });
    }
  });

  const activeConversation = useMemo(() => 
    conversations.find(c => c._id === selectedId), 
  [conversations, selectedId]);

  // --- 1. INIT SOCKET & LISTENERS ---
  useEffect(() => {
    if (!currentUser.id) return;

    const setupSocket = async () => {
      const skt = await initSocket(currentUser.id);
      if (!skt) return;
      setSocket(skt);

      skt.on("receiveMessage", (newMsg) => {
        // Only update message state if we are currently viewing the conversation
        if (newMsg.conversationId === selectedId) {
          setMessages((prev) => [...prev, newMsg]);
          // Mark message as read when received
          skt.emit("markAsRead", { conversationId: selectedId, userId: currentUser.id });
        }
        updateConversationPreview(newMsg, false); // Don't block UI with full re-fetch
      });

      skt.on("userStatusChanged", ({ userId, isOnline }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          isOnline ? next.add(userId) : next.delete(userId);
          return next;
        });
      });

      skt.on("typing", ({ conversationId, typerId }) => {
        if (conversationId === selectedId && typerId !== currentUser.id) {
          setIsTyping(true);
        }
      });

      skt.on("stopTyping", ({ conversationId, typerId }) => {
        if (conversationId === selectedId && typerId !== currentUser.id) {
          setIsTyping(false);
        }
      });
      
      // Ensure current room is joined
      if (selectedId) skt.emit("joinRoom", selectedId);
    };

    setupSocket();

    return () => {
      // FIX: Disconnect socket on unmount
      disconnectSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  // --- 2. LOAD MESSAGES ON SELECTION/JOIN ROOM ---
  useEffect(() => {
    if (selectedId) {
      setIsSidebarOpen(false); // Close sidebar on mobile
      
      // Ensure socket joins the new room and marks as read
      if(socket) {
          socket.emit("joinRoom", selectedId);
          socket.emit("markAsRead", { conversationId: selectedId, userId: currentUser.id });
      }

      startHistoryTransition(async () => {
        const history = await getMessages(selectedId);
        setMessages(history);
      });
    } else {
      setIsSidebarOpen(true);
      setMessages([]);
    }
  }, [selectedId, socket, currentUser.id]);


  // Helpers
  const updateConversationPreview = (msg) => {
    setConversations((prev) => {
      // Logic to find the updated chat and move it to the top
      const updated = prev.map(c => {
        if (c._id === msg.conversationId) {
          // Simplistic preview update
          let previewText = msg.content;
          if (msg.contentType !== 'text') previewText = `[${msg.contentType}]`;

          return { 
            ...c, 
            lastMessage: previewText,
            lastMessageAt: msg.createdAt,
            lastMessageStatus: "delivered",
            // Assuming the sender is the Expert, increment user's unread count for the UI list
            userUnreadCount: msg.senderModel === 'Expert' ? c.userUnreadCount + 1 : 0 
          };
        }
        return c;
      });
      // Sort by recent activity
      return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    });
  };

  const handleTyping = (e) => {
    setInputValue(e.target.value);
    
    if (socket && selectedId) {
      socket.emit("typing", { conversationId: selectedId, typerId: currentUser.id });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { conversationId: selectedId, typerId: currentUser.id });
      }, 1000);
    }
  };

  const sendMessage = (type = "text", content = inputValue) => {
    if (!content.trim() && type === "text") return;

    // 1. Optimistic Update
    const optimisticMsg = {
      _id: Date.now().toString(),
      conversationId: selectedId,
      sender: currentUser.id,
      senderModel: "User",
      content,
      contentType: type,
      createdAt: new Date().toISOString(),
      status: "sending", // Temporary status
      readBy: [currentUser.id]
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);
    if (type === "text") setInputValue("");

    // 2. Socket Emit
    if (socket) {
      socket.emit("sendMessage", {
        conversationId: selectedId,
        sender: currentUser.id,
        senderModel: "User",
        content,
        contentType: type
      });
      socket.emit("stopTyping", { conversationId: selectedId, typerId: currentUser.id });
    }

    // 3. Update Sidebar Preview
    updateConversationPreview(optimisticMsg);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    await startUpload([file]);
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      
      {/* --- SIDEBAR (Conversation List) --- */}
      <div className={cn(
        "w-full md:w-80 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col transition-transform duration-300",
        !isSidebarOpen && "hidden md:flex" 
      )}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
           <h2 className="font-bold text-2xl text-zinc-900 dark:text-white">Messages</h2>
           <Input placeholder="Search chats..." className="mt-4 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((chat) => (
              <div 
                key={chat._id}
                onClick={() => router.push(`/chat?id=${chat._id}`)}
                className={cn(
                  "flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border-b border-zinc-50 dark:border-zinc-900",
                  selectedId === chat._id && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-600"
                )}
              >
                <div className="relative shrink-0">
                  <ProfileImage name={chat.expertId.name} src={chat.expertId.profilePicture} sizeClass="h-12 w-12" />
                  {/* Online Indicator */}
                  {onlineUsers.has(chat.expertId._id) && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-base truncate">{chat.expertId.name}</h3>
                      <span className="text-[10px] text-zinc-400">{format(new Date(chat.lastMessageAt), 'MMM d')}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <p className={cn("text-xs truncate", chat.userUnreadCount > 0 ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-500")}>
                         {chat.lastMessage || "Start a conversation"}
                     </p>
                     {chat.userUnreadCount > 0 && (
                        <span className="h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                            {chat.userUnreadCount > 9 ? '9+' : chat.userUnreadCount}
                        </span>
                     )}
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-zinc-500">No active conversations.</div>
          )}
        </div>
      </div>

      {/* --- CHAT AREA --- */}
      <div className={cn(
        "flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-900/30",
        isSidebarOpen && "hidden md:flex" 
      )}>
        
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setIsSidebarOpen(true)}>
                     <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <ProfileImage name={activeConversation.expertId.name} src={activeConversation.expertId.profilePicture} sizeClass="h-10 w-10" />
                  <div>
                     <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{activeConversation.expertId.name}</h3>
                     <p className="text-xs text-zinc-500 flex items-center gap-1">
                        {onlineUsers.has(activeConversation.expertId._id) ? <span className="text-green-600">Online</span> : "Offline"}
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" disabled title="Start voice call"><Phone className="w-5 h-5 text-zinc-500" /></Button>
                  <Button variant="ghost" size="icon" disabled title="Start video session"><Video className="w-5 h-5 text-zinc-500" /></Button>
                  <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5 text-zinc-500" /></Button>
               </div>
            </div>

            {/* Messages Area (Modular Component) */}
            {isHistoryLoading ? (
                 <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                 </div>
            ) : (
                <ChatMessages 
                    messages={messages} 
                    activeConversation={activeConversation} 
                    currentUser={currentUser} 
                    isTyping={isTyping}
                />
            )}

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
               <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <Button variant="ghost" size="icon" className="rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:bg-zinc-800" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                     {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*, application/pdf" 
                    onChange={handleFileUpload}
                  />
                  
                  <Input 
                    value={inputValue}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..." 
                    className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10" 
                    disabled={isUploading}
                  />
                  
                  <Button size="icon" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={() => sendMessage()} disabled={!inputValue.trim()}>
                     <Send className="w-5 h-5 ml-0.5" />
                  </Button>
               </div>
            </div>

          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
             <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 opacity-50" />
             </div>
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Your Messages</h3>
             <p className="max-w-xs mx-auto text-sm">Select a conversation on the left to start chatting or find an expert to book a session.</p>
             <Button onClick={() => router.push('/experts')} className="mt-6">Find Experts</Button>
          </div>
        )}
      </div>

    </div>
  );
}