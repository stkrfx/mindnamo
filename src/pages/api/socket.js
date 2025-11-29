/*
 * File: src/pages/api/socket.js
 * SR-DEV: Final Socket Server - Chat + Video + Whiteboard + CORS
 */

import { Server } from "socket.io";
import { connectToDatabase } from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import Expert from "@/models/Expert";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log("*First use* Starting Socket.io server...");

    const io = new Server(res.socket.server, {
      path: "/api/socket_io",
      addTrailingSlash: false,
      cors: {
        // SR-DEV: Robust CORS for Local & Cloud
        origin: (origin, callback) => {
          const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:3001",
          ];
          // Allow allowed origins OR any subdomain of cloudworkstations.dev
          if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".cloudworkstations.dev")) {
            callback(null, true);
          } else {
            callback(null, true); // Dev: allow all to prevent headaches during rapid dev
          }
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", async (socket) => {
      // 1. Handle Online Status on Connection
      const { userId, model } = socket.handshake.query;
      
      if (userId && model) {
        socket.join(userId); // Join personal room for direct status updates
        try {
          await connectToDatabase();
          const TargetModel = model === "User" ? User : Expert;
          
          // Mark as Online
          await TargetModel.findByIdAndUpdate(userId, { 
            isOnline: true, 
            lastSeen: new Date() 
          });
          
          // Broadcast "I am online" to everyone
          socket.broadcast.emit("userStatusChanged", { userId, isOnline: true, lastSeen: new Date() });
        } catch (e) { console.error("Error setting online status:", e); }
      }

      // --- VIDEO CALL & WHITEBOARD EVENTS ---
      
      // A. Join Video Room
      socket.on("join-video", (roomId) => {
        socket.join(roomId);
      });

      // B. "I am Ready" - Client confirmed media access
      socket.on("client-ready", (roomId) => {
        // Notify others in the room that a user connected & is ready
        socket.to(roomId).emit("user-connected", socket.id); 
      });

      // C. Signaling
      socket.on("offer", (payload) => {
        socket.to(payload.roomId).emit("offer", payload);
      });

      socket.on("answer", (payload) => {
        socket.to(payload.roomId).emit("answer", payload);
      });

      socket.on("ice-candidate", (payload) => {
        socket.to(payload.roomId).emit("ice-candidate", payload);
      });

      // D. Whiteboard
      socket.on("wb-draw", (data) => {
        socket.to(data.roomId).emit("wb-draw", data);
      });

      socket.on("wb-clear", (roomId) => {
        socket.to(roomId).emit("wb-clear");
      });
      
      // E. Whiteboard Sync (State recovery for new joiners)
      socket.on("wb-request-state", (roomId) => {
        socket.to(roomId).emit("wb-request-state", { requesterId: socket.id });
      });
      socket.on("wb-send-state", ({ roomId, image, requesterId }) => {
        io.to(requesterId).emit("wb-update-state", { image });
      });


      // --- CHAT EVENTS ---

      // 2. Join Chat Room
      socket.on("joinRoom", (conversationId) => {
        socket.join(conversationId);
      });

      // 3. Send Message
      socket.on("sendMessage", async (data) => {
        const { conversationId, sender, senderModel, content, contentType, replyTo } = data;
        if (!conversationId || !sender || !content) return;

        try {
          await connectToDatabase();
          
          const newMessage = await Message.create({
            conversationId, sender, senderModel, content,
            contentType: contentType || "text",
            replyTo: replyTo || null,
            readBy: [sender]
          });

          // Populate for the client UI
          const populatedMessage = await Message.findById(newMessage._id).populate('replyTo').lean();

          let previewText = content;
          if (contentType === 'image') previewText = "📷 Image";
          else if (contentType === 'audio') previewText = "🎤 Audio Message";
          else if (contentType === 'pdf') previewText = "📄 Document";

          // Update conversation metadata
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: previewText,
            lastMessageAt: newMessage.createdAt,
            lastMessageSender: sender,
            $inc: { [senderModel === 'User' ? 'expertUnreadCount' : 'userUnreadCount']: 1 }
          });

          // Emit to room
          io.to(conversationId).emit("receiveMessage", populatedMessage);
          
          // Emit list update to participants
          io.to(conversationId).emit("conversationUpdated", {
             conversationId,
             lastMessage: previewText,
             lastMessageAt: populatedMessage.createdAt,
             lastMessageSender: sender,
             lastMessageStatus: "sent"
          });

        } catch (error) {
          console.error("Socket [sendMessage] Error:", error);
        }
      });

      // 4. Mark Read
      socket.on("markAsRead", async ({ conversationId, userId }) => {
        if (!conversationId || !userId) return;
        try {
            await connectToDatabase();
            // Add user to readBy array for all unread messages
            await Message.updateMany(
                { conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
                { $addToSet: { readBy: userId } }
            );
            
            // Reset unread count
            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                const isUser = userId.toString() === conversation.userId.toString();
                const update = isUser ? { userUnreadCount: 0 } : { expertUnreadCount: 0 };
                await Conversation.findByIdAndUpdate(conversationId, update);
            }
            
            io.to(conversationId).emit("messagesRead", { conversationId, readByUserId: userId });
        } catch (error) { console.error("Socket [markAsRead] Error:", error); }
      });

      // 5. Typing Indicators
      socket.on("typing", (d) => socket.to(d.conversationId).emit("typing", d));
      socket.on("stopTyping", (d) => socket.to(d.conversationId).emit("stopTyping", d));

      // 6. Disconnect
      socket.on("disconnect", async () => {
        if (userId && model) {
          try {
             await connectToDatabase();
             const TargetModel = model === "User" ? User : Expert;
             await TargetModel.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
             socket.broadcast.emit("userStatusChanged", { userId, isOnline: false, lastSeen: new Date() });
          } catch (e) { console.error(e); }
        }
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;