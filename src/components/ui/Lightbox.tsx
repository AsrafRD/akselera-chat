"use client";

import { X } from "lucide-react";

interface LightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function Lightbox({ imageUrl, onClose }: LightboxProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8" 
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors" 
        onClick={onClose}
      >
        <X size={32} />
      </button>
      <img 
        src={imageUrl} 
        alt="Fullscreen Preview" 
        className="max-w-full max-h-full object-contain" 
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
}
