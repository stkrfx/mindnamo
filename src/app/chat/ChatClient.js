/*
 * File: src/app/chat/ChatClient.js
 * SR-DEV: Premium User Chat UI - Final Production Version
 * Features:
 * - Real-time Socket.io integration (Chat + Typing + Online Status)
 * - Optimistic Updates for instant feedback
 * - Voice Notes & File Uploads
 * - Responsive Sidebar logic
 */

"use client";

import { useState, useEffect, useRef, useTransition, useCallback, useLayoutEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import ProfileImage from "@/components/ProfileImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages } from "@/actions/chat";
import { initSocket, disconnectSocket } from "@/lib/socket-client";
import { useUploadThing } from "@/lib/uploadthing";
import { format, isToday, isYesterday } from "date-fns";

// --- Icons ---
import { 
  Send, Mic, Paperclip, Smile, MoreVertical, Phone, Video, 
  ChevronLeft, Check, CheckCheck, Clock, X, Play, Pause, FileText, Image as ImageIcon 
} from "lucide-react";

// --- Helper: Date Formatting ---
const formatMessageTime = (dateStr) => {
  const date = new Date(dateStr);
  return format(date, "HH:mm");
};

const formatHeaderDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
};

// --- SUB-COMPONENT: Audio Player ---
const VoiceMessagePlayer = ({ src, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={cn("flex items-center gap-3 p-2 rounded-lg min-w-[160px]", isOwn ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-800")}>
      <button onClick={togglePlay} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </button>
      <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
         <div className={cn("h-full bg-white transition-all duration-500", isPlaying ? "w-full animate-pulse" : "w-0")} />
      </div>
      <audio 
        ref={audioRef} 
        src={src} 
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />
    </div>
  );
};

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
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // File Upload Hook
  const { startUpload } = useUploadThing("chatAttachment", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        sendMessage("image", res[0].url); // Simplified: assuming image for now
        setIsUploading(false);
      }
    },
    onUploadError: () => {
      setIsUploading(false);
      alert("Failed to upload file");
    }
  });

  const activeConversation = useMemo(() => 
    conversations.find(c => c._id === selectedId), 
  [conversations, selectedId]);

  // 1. INIT SOCKET & LISTENERS
  useEffect(() => {
    const setupSocket = async () => {
      const skt = await initSocket(currentUser.id);
      if (!skt) return;
      setSocket(skt);

      skt.on("receiveMessage", (newMsg) => {
        if (newMsg.conversationId === selectedId) {
          setMessages((prev) => [...prev, newMsg]);
          skt.emit("markAsRead", { conversationId: selectedId, userId: currentUser.id });
        }
        // Update list preview
        updateConversationPreview(newMsg);
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
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.off("receiveMessage");
        socket.off("userStatusChanged");
        socket.off("typing");
        socket.off("stopTyping");
      }
    };
  }, [currentUser.id, selectedId]);

  // 2. LOAD MESSAGES ON SELECTION
  useEffect(() => {
    if (selectedId) {
      setIsSidebarOpen(false); // Close sidebar on mobile
      startTransition(async () => {
        const history = await getMessages(selectedId);
        setMessages(history);
      });
    } else {
      setIsSidebarOpen(true);
    }
  }, [selectedId]);

  // 3. SCROLL TO BOTTOM
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Helpers
  const updateConversationPreview = (msg) => {
    setConversations((prev) => {
      const updated = prev.map(c => {
        if (c._id === msg.conversationId) {
          return { 
            ...c, 
            lastMessage: msg.contentType === 'text' ? msg.content : `[${msg.contentType}]`,
            lastMessageAt: msg.createdAt,
            lastMessageStatus: "delivered"
          };
        }
        return c;
      });
      // Sort by recent
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

    const tempId = Date.now().toString();
    const optimisticMsg = {
      _id: tempId,
      conversationId: selectedId,
      sender: currentUser.id,
      senderModel: "User",
      content,
      contentType: type,
      createdAt: new Date().toISOString(),
      status: "sending",
      readBy: []
    };

    // 1. Optimistic Update
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
    <div className="flex h-[calc(100dvh-64px)] bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      
      {/* --- SIDEBAR (Conversation List) --- */}
      <div className={cn(
        "w-full md:w-80 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col",
        !isSidebarOpen && "hidden md:flex" // Hide on mobile when chat active
      )}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
           <h2 className="font-bold text-xl">Messages</h2>
           <Input placeholder="Search chats..." className="mt-4 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <div 
              key={chat._id}
              onClick={() => router.push(`/chat?id=${chat._id}`)}
              className={cn(
                "flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border-b border-zinc-50 dark:border-zinc-900",
                selectedId === chat._id && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-600"
              )}
            >
              <div className="relative">
                <ProfileImage name={chat.expertId.name} src={chat.expertId.profilePicture} sizeClass="h-12 w-12" />
                {/* Online Indicator */}
                {onlineUsers.has(chat.expertId._id) && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-sm truncate">{chat.expertId.name}</h3>
                    <span className="text-[10px] text-zinc-400">{formatMessageTime(chat.lastMessageAt)}</span>
                 </div>
                 <p className={cn("text-xs truncate", chat.userUnreadCount > 0 ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-500")}>
                    {chat.lastMessage || "Start a conversation"}
                 </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CHAT AREA --- */}
      <div className={cn(
        "flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30",
        isSidebarOpen && "hidden md:flex" // Hide on mobile when sidebar active
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
                     <h3 className="font-bold text-sm">{activeConversation.expertId.name}</h3>
                     <p className="text-xs text-zinc-500 flex items-center gap-1">
                        {activeConversation.expertId.isOnline ? <span className="text-green-600">Online</span> : "Offline"}
                        {isTyping && <span className="text-blue-600 animate-pulse ml-1">• typing...</span>}
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon"><Phone className="w-5 h-5 text-zinc-500" /></Button>
                  <Button variant="ghost" size="icon"><Video className="w-5 h-5 text-zinc-500" /></Button>
                  <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5 text-zinc-500" /></Button>
               </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {/* Group messages by Date could go here in future iteration */}
               {messages.map((msg, i) => {
                 const isOwn = msg.senderModel === "User";
                 const showDate = i === 0 || formatHeaderDate(msg.createdAt) !== formatHeaderDate(messages[i-1].createdAt);
                 
                 return (
                   <div key={msg._id || i}>
                     {showDate && (
                       <div className="flex justify-center mb-4">
                         <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] px-3 py-1 rounded-full font-medium uppercase tracking-wide">
                           {formatHeaderDate(msg.createdAt)}
                         </span>
                       </div>
                     )}
                     
                     <div className={cn("flex gap-3 max-w-[80%]", isOwn ? "ml-auto flex-row-reverse" : "")}>
                        {!isOwn && <ProfileImage name={activeConversation.expertId.name} src={activeConversation.expertId.profilePicture} sizeClass="h-8 w-8 mt-auto" />}
                        
                        <div className={cn(
                          "p-3 rounded-2xl shadow-sm relative group min-w-[120px]",
                          isOwn 
                            ? "bg-blue-600 text-white rounded-br-none" 
                            : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none border border-zinc-100 dark:border-zinc-700"
                        )}>
                           {/* Content Renderers */}
                           {msg.contentType === "text" && <p className="text-sm leading-relaxed">{msg.content}</p>}
                           {msg.contentType === "image" && (
                             <img src={msg.content} alt="Attachment" className="rounded-lg max-w-full mb-1 cursor-pointer hover:opacity-90" />
                           )}
                           {msg.contentType === "audio" && <VoiceMessagePlayer src={msg.content} isOwn={isOwn} />}

                           {/* Meta (Time & Status) */}
                           <div className={cn("flex items-center justify-end gap-1 mt-1", isOwn ? "text-blue-100" : "text-zinc-400")}>
                              <span className="text-[10px]">{formatMessageTime(msg.createdAt)}</span>
                              {isOwn && (
                                msg.status === "sending" ? <Clock className="w-3 h-3" /> : 
                                msg.readBy?.length > 1 ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                              )}
                           </div>
                        </div>
                     </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
               <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-full border border-zinc-200 dark:border-zinc-800">
                  <Button variant="ghost" size="icon" className="rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:bg-zinc-800" onClick={() => fileInputRef.current?.click()}>
                     <Paperclip className="w-5 h-5" />
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                  />
                  
                  <Input 
                    value={inputValue}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..." 
                    className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" 
                  />
                  
                  {inputValue.trim() ? (
                    <Button size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => sendMessage()}>
                       <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                  ) : (
                    <Button size="icon" className="rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900">
                       <Mic className="w-5 h-5" />
                    </Button>
                  )}
               </div>
            </div>

          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
             <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Smile className="w-10 h-10 opacity-50" />
             </div>
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Your Messages</h3>
             <p className="max-w-xs mx-auto text-sm">Select a conversation to start chatting or find an expert to book a session.</p>
             <Button onClick={() => router.push('/experts')} variant="outline" className="mt-6">Find Experts</Button>
          </div>
        )}
      </div>

    </div>
  );
}