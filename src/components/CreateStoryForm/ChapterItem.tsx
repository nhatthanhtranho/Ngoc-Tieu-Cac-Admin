'use client';

import { Chapter } from "@/types/chapter";

interface ChapterItemProps {
  chapter: Chapter;
  index: number;
  isActive: boolean;
  onChange: (index: number, field: keyof Chapter, value: string) => void;
  onRemove: (index: number) => void;
  onClick: () => void;
}

export default function ChapterItem({ chapter, index, isActive, onChange, onRemove, onClick }: ChapterItemProps) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 relative cursor-pointer transition ${isActive ? "bg-blue-100 border-blue-500" : "bg-gray-50"}`}
    >
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(index); }}
          className="text-red-600 hover:text-red-800 px-2 py-1 border rounded"
          title="Xóa chương"
        >
          Xóa
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={chapter.title}
        onChange={e => onChange(index, "title", e.target.value)}
        placeholder={`Tên chương ${index + 1}`}
        className="w-full mb-2 rounded-lg border p-2"
      />

      {/* Slug */}
      <input
        type="text"
        value={chapter.slug}
        onChange={e => onChange(index, "slug", e.target.value)}
        placeholder="Slug chương"
        className="w-full mb-2 rounded-lg border p-2 text-gray-600"
      />

      {/* Content */}
      {/* <textarea
        value={chapter.content}
        onChange={e => onChange(index, "content", e.target.value)}
        placeholder="Nội dung chương..."
        rows={isActive ? 10 : 4}
        className="w-full rounded-lg border p-2 transition-all duration-200"
      /> */}
    </div>
  );
}
