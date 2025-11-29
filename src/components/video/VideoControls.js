/*
 * File: src/components/video/VideoControls.js
 * SR-DEV: Video Call Control Bar (Modular Component)
 * Handles media track toggling (Audio/Video) and call termination.
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VideoControls({ 
  localStream, 
  onEndCall, 
  className 
}) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [hasMedia, setHasMedia] = useState(false);

  // Sync initial state with actual track status on mount
  useEffect(() => {
    if (localStream) {
      setHasMedia(true);
      const audioTrack = localStream.getAudioTracks()[0];
      const videoTrack = localStream.getVideoTracks()[0];
      if (audioTrack) setIsMicOn(audioTrack.enabled);
      if (videoTrack) setIsCamOn(videoTrack.enabled);
    } else {
      setHasMedia(false);
    }
  }, [localStream]);

  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
    }
  };

  return (
    <div className={cn("flex items-center justify-center gap-4 p-3 bg-zinc-900/90 backdrop-blur-md rounded-full shadow-2xl border border-zinc-800", className)}>
      
      {/* Mic Toggle */}
      <Button
        size="icon"
        disabled={!hasMedia}
        variant={isMicOn ? "secondary" : "destructive"}
        className={cn(
          "rounded-full h-12 w-12 transition-all duration-200",
          isMicOn ? "bg-zinc-700 hover:bg-zinc-600 text-white" : "bg-red-500 hover:bg-red-600",
          !hasMedia && "opacity-50 cursor-not-allowed"
        )}
        onClick={toggleMic}
        title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
      >
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </Button>

      {/* Camera Toggle */}
      <Button
        size="icon"
        disabled={!hasMedia}
        variant={isCamOn ? "secondary" : "destructive"}
        className={cn(
          "rounded-full h-12 w-12 transition-all duration-200",
          isCamOn ? "bg-zinc-700 hover:bg-zinc-600 text-white" : "bg-red-500 hover:bg-red-600",
          !hasMedia && "opacity-50 cursor-not-allowed"
        )}
        onClick={toggleCam}
        title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
      >
        {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </Button>

      {/* End Call */}
      <Button
        size="icon"
        variant="destructive"
        className="rounded-full h-12 w-12 bg-red-600 hover:bg-red-700 shadow-lg scale-110 hover:scale-125 transition-transform duration-200 ml-2"
        onClick={onEndCall}
        title="End Call"
      >
        <PhoneOff className="w-5 h-5 fill-current" />
      </Button>
      
    </div>
  );
}