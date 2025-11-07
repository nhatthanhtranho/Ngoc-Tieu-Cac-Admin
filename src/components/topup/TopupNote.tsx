"use client";
import { StickyNote } from "lucide-react";

interface Props {
  userNote: string;
  adminNote: string;
  onChange: (field: "userNote" | "adminNote", value: string) => void;
}

export default function TopupNotes({ userNote, adminNote, onChange }: Props) {
  return (
    <div className="space-y-5">
      {/* USER NOTE */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="w-4 h-4 text-emerald-400/80" />
          <span className="font-medium text-emerald-100">
            Ghi chú từ người dùng:
          </span>
        </div>
        <textarea
          className="
            w-full rounded-lg px-3 py-2.5 text-sm text-emerald-100
            bg-[#0b1413]/80 border border-emerald-800/50 
            placeholder:text-emerald-400/30 
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600/60
            transition-all duration-200 resize-none
          "
          rows={2}
          value={userNote}
          onChange={(e) => onChange("userNote", e.target.value)}
          placeholder="Không có ghi chú từ người dùng..."
        />
      </div>

      {/* ADMIN NOTE */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="w-4 h-4 text-rose-400/80" />
          <span className="font-medium text-rose-100">
            Ghi chú nội bộ (Admin):
          </span>
        </div>
        <textarea
          className="
            w-full rounded-lg px-3 py-2.5 text-sm text-rose-100
            bg-[#130b0c]/70 border border-rose-800/50 
            placeholder:text-rose-400/30 
            focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-600/60
            transition-all duration-200 resize-none
          "
          rows={2}
          value={adminNote}
          onChange={(e) => onChange("adminNote", e.target.value)}
          placeholder="Chỉ hiển thị cho admin..."
        />
      </div>
    </div>
  );
}
