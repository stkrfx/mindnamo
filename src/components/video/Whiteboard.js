/*
 * File: src/components/video/Whiteboard.js
 * SR-DEV: Collaborative Whiteboard Component
 * ACTION: ADDED handleCaptureDataURL function for parent component access via ref.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pen, Eraser, Trash2, Download, Undo } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  { id: "black", hex: "#000000" },
  { id: "red", hex: "#ef4444" },
  { id: "blue", hex: "#3b82f6" },
  { id: "green", hex: "#22c55e" },
];

// Helper function to capture image data URL with white background
const captureCanvasDataURL = (canvas) => {
    if (!canvas) return null;
    
    // Create a temporary canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    
    // Fill background with white (since main canvas is transparent by default)
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw existing content from the main canvas
    tempCtx.drawImage(canvas, 0, 0);

    return tempCanvas.toDataURL('image/png');
};


export default function Whiteboard({ socket, roomId, canvasRef }) {
  const localCanvasRef = useRef(null); 
  const containerRef = useRef(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [isEraser, setIsEraser] = useState(false);
  
  // Drawing State
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  // Expose the capture function to the parent component via the ref prop
  useEffect(() => {
    if (canvasRef) {
      canvasRef.current = {
        getWhiteboardDataURL: () => captureCanvasDataURL(localCanvasRef.current),
        element: localCanvasRef.current
      };
    }
  }, [canvasRef, localCanvasRef.current]); 


  // --- 1. Socket Event Listeners ---
  useEffect(() => {
    if (!socket) return;

    // Handle incoming draw events
    const onDraw = ({ x0, y0, x1, y1, color, width }) => {
      const canvas = localCanvasRef.current;
      if (!canvas) return;
      drawLine(
        x0 * canvas.width, 
        y0 * canvas.height, 
        x1 * canvas.width, 
        y1 * canvas.height, 
        color, 
        width, 
        false // Do not emit back
      );
    };

    // Handle clear board
    const onClear = () => {
      const canvas = localCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Handle state sync request (New user joined)
    const onRequestState = ({ requesterId }) => {
      const canvas = localCanvasRef.current;
      if (!canvas) return;
      // Send current canvas as image data URL
      const image = captureCanvasDataURL(canvas);
      socket.emit("wb-send-state", { roomId, image, requesterId });
    };

    // Handle state update (I am the new user)
    const onUpdateState = ({ image }) => {
      const canvas = localCanvasRef.current;
      if (!canvas) return;
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, 0, 0);
      };
      img.src = image;
    };

    socket.on("wb-draw", onDraw);
    socket.on("wb-clear", onClear);
    socket.on("wb-request-state", onRequestState);
    socket.on("wb-update-state", onUpdateState);

    // Request initial state when mounting
    socket.emit("wb-request-state", roomId);

    return () => {
      socket.off("wb-draw", onDraw);
      socket.off("wb-clear", onClear);
      socket.off("wb-request-state", onRequestState);
      socket.off("wb-update-state", onUpdateState);
    };
  }, [socket, roomId, canvasRef]); 

  // --- 2. Resize Logic ---
  useEffect(() => {
    const canvas = localCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      // Save current content
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);

      // Resize
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      // Restore content (scaled)
      const ctx = canvas.getContext("2d");
      // Set white background initially
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
      
      // Set defaults again as context resets on resize
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    
    // Initial resize call
    resize(); 

    return () => observer.disconnect();
  }, []);

  // --- 3. Drawing Helpers ---
  
  const drawLine = (x0, y0, x1, y1, color, width, emit = true) => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.closePath();

    if (emit && socket) {
      const w = canvas.width;
      const h = canvas.height;
      socket.emit("wb-draw", {
        roomId,
        x0: x0 / w, // Normalize coordinates (0-1)
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color,
        width
      });
    }
  };

  const startDrawing = (e) => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;
    
    isDrawing.current = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = canvas.getBoundingClientRect();
    lastX.current = clientX - rect.left;
    lastY.current = clientY - rect.top;
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault(); 

    const canvas = localCanvasRef.current;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    drawLine(
      lastX.current, 
      lastY.current, 
      currentX, 
      currentY, 
      isEraser ? "#FFFFFF" : activeColor, 
      isEraser ? 20 : 3, 
      true
    );

    lastX.current = currentX;
    lastY.current = currentY;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const handleClear = () => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (socket) socket.emit("wb-clear", roomId);
  };

  const handleDownload = () => {
    const dataURL = captureCanvasDataURL(localCanvasRef.current);
    if (!dataURL) return;
    const link = document.createElement("a");
    link.download = `mind-namo-whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-inner cursor-crosshair">
      
      <canvas
        ref={localCanvasRef}
        className="block touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-full p-2 flex items-center gap-2 z-30">
        
        {/* Colors */}
        <div className="flex gap-1 pr-2 border-r border-zinc-200 dark:border-zinc-700">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveColor(c.hex); setIsEraser(false); }}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                activeColor === c.hex && !isEraser ? "border-zinc-900 dark:border-white scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={`Select ${c.id}`}
            />
          ))}
        </div>

        {/* Tools */}
        <Button 
          variant={!isEraser && activeColor === "#000000" ? "secondary" : "ghost"}
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={() => { setActiveColor("#000000"); setIsEraser(false); }}
          title="Pen Tool"
        >
          <Pen className="w-4 h-4" />
        </Button>

        <Button 
          variant={isEraser ? "secondary" : "ghost"} 
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={() => setIsEraser(!isEraser)}
          title="Eraser"
        >
          <Eraser className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50/50"
          onClick={handleClear}
          title="Clear Board"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full text-zinc-500"
          onClick={handleDownload}
          title="Save Image"
        >
          <Download className="w-4 h-4" />
        </Button>

      </div>
      
      <div className="absolute bottom-4 left-4 bg-black/5 text-[10px] text-black/50 px-2 py-1 rounded pointer-events-none">
         Synced • {roomId}
      </div>

    </div>
  );
}