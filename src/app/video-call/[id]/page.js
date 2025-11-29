/*
 * File: src/app/video-call/[id]/page.js
 * SR-DEV: User Video Client (Full Implementation with Whiteboard Persistence)
 * ACTION: Integrated modular VideoControls component (121).
 */

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Whiteboard from "@/components/video/Whiteboard"; // NEW IMPORT (File 73)
import VideoControls from "@/components/video/VideoControls"; // NEW IMPORT (File 90)
import { saveWhiteboardData } from "@/actions/video"; // NEW IMPORT (File 101)
import { uploadBase64Image } from "@/actions/file"; // NEW IMPORT (File 102)

const VIDEO_STATE = {
  PENDING: "PENDING",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  DISCONNECTED: "DISCONNECTED"
};

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const whiteboardRef = useRef(null); // Ref for Whiteboard component (to access capture function)
  
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const iceQueueRef = useRef([]);
  const localStreamRef = useRef(null); // Separate ref for the stream

  const [callState, setCallState] = useState(VIDEO_STATE.PENDING);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);
  const [isWhiteboardSaving, setIsWhiteboardSaving] = useState(false);
  
  const isVideoRoomOpen = useMemo(() => appointmentId, [appointmentId]);


  // --- 1. CORE SOCKET & WEBRTC SETUP ---
  useEffect(() => {
    if (!isVideoRoomOpen || socketRef.current) return;

    setCallState(VIDEO_STATE.CONNECTING);

    const init = async () => {
      try {
         await fetch("/api/socket").catch(() => {});
         
         const newSocket = io(undefined, { 
             path: "/api/socket_io",
             transports: ["websocket", "polling"]
             // TODO: Pass actual userId/model for Socket.js (File 27) logic
         });
         socketRef.current = newSocket;

         // 1. Get Local Media
         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
         localStreamRef.current = stream;
         if (localVideoRef.current) {
             localVideoRef.current.srcObject = stream;
             localVideoRef.current.muted = true;
         }

         // 2. Initialize Peer Connection
         const peer = new RTCPeerConnection({
             iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
         });
         peerRef.current = peer;
         stream.getTracks().forEach(track => peer.addTrack(track, stream));

         // Peer Listeners
         peer.ontrack = (event) => {
             const [remoteStream] = event.streams;
             if (remoteVideoRef.current) {
                 remoteVideoRef.current.srcObject = remoteStream;
                 setRemoteUserConnected(true);
                 setCallState(VIDEO_STATE.ACTIVE);
                 remoteVideoRef.current.play().catch(() => {});
             }
         };

         peer.onicecandidate = (event) => {
             if (event.candidate) {
                 newSocket.emit("ice-candidate", { candidate: event.candidate, roomId: appointmentId });
             }
         };
         
         // Socket Listeners
         newSocket.emit("join-video", appointmentId);
         newSocket.emit("client-ready", appointmentId);

         newSocket.on("user-connected", async () => {
             const offer = await peer.createOffer();
             await peer.setLocalDescription(offer);
             newSocket.emit("offer", { offer, roomId: appointmentId });
         });

         newSocket.on("offer", async ({ offer }) => {
             await peer.setRemoteDescription(new RTCSessionDescription(offer));
             const answer = await peer.createAnswer();
             await peer.setLocalDescription(answer);
             newSocket.emit("answer", { answer, roomId: appointmentId });
             processIceQueue();
         });

         newSocket.on("answer", async ({ answer }) => {
             await peer.setRemoteDescription(new RTCSessionDescription(answer));
             processIceQueue();
         });

         newSocket.on("ice-candidate", async ({ candidate }) => {
             if (peer.remoteDescription) {
                 await peer.addIceCandidate(new RTCIceCandidate(candidate));
             } else {
                 iceQueueRef.current.push(candidate);
             }
         });
         
         newSocket.on("disconnect", () => {
             toast.info("Expert has disconnected", { description: "Session ended." });
             setRemoteUserConnected(false);
         });

      } catch (err) {
          console.error("Init Failed:", err);
          setCallState(VIDEO_STATE.DISCONNECTED);
          toast.error("Media Error", { description: "Failed to access camera/mic. Check permissions." });
      }
    };

    const processIceQueue = async () => {
        if (!peerRef.current) return;
        while (iceQueueRef.current.length > 0) {
            const candidate = iceQueueRef.current.shift();
            try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
        }
    };

    init();

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerRef.current) peerRef.current.close();
    };
  }, [isVideoRoomOpen, appointmentId]);
  
  // --- 2. END CALL & PERSISTENCE HANDLER ---
  const handleEndCall = async () => {
    if (isWhiteboardSaving) return;
    
    setIsWhiteboardSaving(true);
    toast.info("Saving session notes...", { duration: 5000 });
    
    try {
        let wbUrl = null;
        
        // 1. Capture Whiteboard Data
        if (whiteboardRef.current?.getWhiteboardDataURL) {
            const dataURL = whiteboardRef.current.getWhiteboardDataURL();
            if (dataURL) {
                // 2. Upload Base64 to Cloud Storage (File 102)
                const uploadResult = await uploadBase64Image(dataURL);
                if (uploadResult.success) {
                    wbUrl = uploadResult.url;
                } else {
                    toast.warning("Notes Save Failed", { description: "Could not upload whiteboard image." });
                }
            }
        }
        
        // 3. Save URL to Appointment (File 101)
        if (wbUrl) {
            await saveWhiteboardData(appointmentId, wbUrl);
            toast.success("Session Saved", { description: "Your notes are available on the dashboard." });
        }

    } catch (error) {
        console.error("Call End Error:", error);
        toast.error("Session End Error", { description: "An error occurred during final save." });
    } finally {
        // 4. Clean up media and close connection
        if (socketRef.current) socketRef.current.disconnect();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setIsWhiteboardSaving(false);
        setCallState(VIDEO_STATE.DISCONNECTED);
        
        // 5. Redirect user to the dashboard
        router.push(`/appointments`);
    }
  };

  const getStatusMessage = () => {
    switch(callState) {
        case VIDEO_STATE.PENDING: return "Starting media access...";
        case VIDEO_STATE.CONNECTING: return "Waiting for expert to join...";
        case VIDEO_STATE.ACTIVE: return remoteUserConnected ? "In session" : "Connecting media...";
        case VIDEO_STATE.DISCONNECTED: return "Call ended.";
        default: return "Initializing...";
    }
  };
  
  // --- Render ---
  if (!isVideoRoomOpen) {
      return <div className="p-10 text-center text-white bg-zinc-950">Invalid session ID.</div>;
  }
  
  if (callState === VIDEO_STATE.PENDING || callState === VIDEO_STATE.CONNECTING) {
      return (
          <div className="flex h-[100dvh] items-center justify-center bg-zinc-950 flex-col">
              <Loader2 className="h-10 w-10 text-zinc-600 animate-spin mb-4" />
              <p className="text-zinc-400">{getStatusMessage()}</p>
          </div>
      );
  }

  return (
    <div className="flex h-[100dvh] bg-zinc-900 overflow-hidden relative">
      
      {/* Center: Whiteboard (Main Collaboration Area) */}
      <div className="flex-1 relative p-4 lg:p-6 flex flex-col">
        <Whiteboard 
          socket={socketRef.current} 
          roomId={appointmentId} 
          canvasRef={whiteboardRef} // Pass ref for persistence
        />
        
        {/* Floating Controls */}
        <VideoControls 
           localStream={localStreamRef.current}
           onEndCall={handleEndCall}
           className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40"
        />
      </div>

      {/* Right: Video Stack Sidebar */}
      <div className="w-full h-full lg:w-80 bg-zinc-950 flex flex-col lg:flex-shrink-0 border-l border-zinc-800">
        
        {/* Remote Video */}
        <div className="flex-1 relative border-b border-zinc-800 bg-zinc-900">
           <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
           {!remoteUserConnected && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <p className="text-white text-sm">Waiting for expert...</p>
             </div>
           )}
           <span className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">Expert</span>
        </div>
        
        {/* Local Video */}
        <div className="w-full lg:flex-1 relative bg-zinc-900 h-1/3 lg:h-auto">
           <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-zinc-800" />
           <span className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">You</span>
        </div>
      </div>
    </div>
  );
}