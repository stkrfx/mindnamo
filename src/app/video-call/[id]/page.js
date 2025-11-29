/*
 * File: src/app/video-call/[id]/page.js
 * SR-DEV: User Video Client (Supports Receiving Color/Eraser)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";

export default function VideoCallPage() {
  const params = useParams();
  const appointmentId = params.id;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const iceQueueRef = useRef([]);

  useEffect(() => {
    if (!appointmentId) return;
    if (socketRef.current) return;

    const init = async () => {
      try {
         await fetch("/api/socket").catch(() => {});
         
         const newSocket = io(undefined, { 
             path: "/api/socket_io",
             transports: ["websocket", "polling"]
         });
         socketRef.current = newSocket;

         newSocket.emit("join-video", appointmentId);

         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
         if (localVideoRef.current) {
             localVideoRef.current.srcObject = stream;
             localVideoRef.current.muted = true; 
         }

         const peer = new RTCPeerConnection({
             iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
         });
         peerRef.current = peer;

         stream.getTracks().forEach(track => peer.addTrack(track, stream));

         peer.ontrack = (event) => {
             const [remoteStream] = event.streams;
             if (remoteVideoRef.current) {
                 remoteVideoRef.current.srcObject = remoteStream;
                 remoteVideoRef.current.play().catch(() => {});
             }
         };

         peer.onicecandidate = (event) => {
             if (event.candidate) {
                 newSocket.emit("ice-candidate", { candidate: event.candidate, roomId: appointmentId });
             }
         };

         newSocket.emit("client-ready", appointmentId);
         newSocket.emit("wb-request-state", appointmentId);

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

         // --- WHITEBOARD LISTENERS ---
         newSocket.on("wb-draw", drawOnCanvas);
         
         newSocket.on("wb-clear", () => {
             const canvas = canvasRef.current;
             if (canvas) {
                 const ctx = canvas.getContext("2d");
                 ctx.fillStyle = "#ffffff";
                 ctx.fillRect(0, 0, canvas.width, canvas.height);
             }
         });
         
         newSocket.on("wb-update-state", ({ image }) => {
             const img = new Image();
             img.onload = () => canvasRef.current?.getContext("2d").drawImage(img, 0, 0);
             img.src = image;
         });

      } catch (err) {
          console.error("Init Failed:", err);
          alert("Failed to access camera/mic.");
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
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (peerRef.current) peerRef.current.close();
    };
  }, [appointmentId]);

  const drawOnCanvas = ({ x0, y0, x1, y1, color, width }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.beginPath();
    ctx.moveTo(x0 * w, y0 * h);
    ctx.lineTo(x1 * w, y1 * h);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  useEffect(() => {
      const resize = () => {
          if(canvasRef.current) {
              canvasRef.current.width = canvasRef.current.parentElement.offsetWidth;
              canvasRef.current.height = canvasRef.current.parentElement.offsetHeight;
              const ctx = canvasRef.current.getContext("2d");
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
      };
      window.addEventListener("resize", resize);
      setTimeout(resize, 500);
      return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="flex h-[100dvh] bg-zinc-900 overflow-hidden">
      {/* Left: Whiteboard */}
      <div className="flex-1 relative bg-white cursor-default">
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm pointer-events-none">
          Live Whiteboard (View Only)
        </div>
      </div>

      {/* Right: Video Stack */}
      <div className="w-80 bg-zinc-950 flex flex-col border-l border-zinc-800">
        <div className="flex-1 relative border-b border-zinc-800 bg-zinc-900">
           <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
           <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">Expert</span>
        </div>
        <div className="flex-1 relative bg-zinc-900">
           <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-zinc-800" />
           <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">You</span>
        </div>
        <div className="p-4 bg-zinc-950">
           <Button variant="destructive" className="w-full" onClick={() => window.close()}>End Call</Button>
        </div>
      </div>
    </div>
  );
}