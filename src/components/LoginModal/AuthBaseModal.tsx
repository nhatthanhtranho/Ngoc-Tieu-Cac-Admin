"use client";
import { X } from "lucide-react";

interface AuthBaseModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AuthBaseModal({
  open,
  title,
  onClose,
  children,
}: AuthBaseModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1c1c1f] p-6 rounded-2xl shadow-lg w-[90%] max-w-sm relative animate-fade-in"
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
