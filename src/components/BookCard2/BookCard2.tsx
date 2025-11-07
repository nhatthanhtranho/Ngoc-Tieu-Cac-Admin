"use client";
import { Bookmark } from "lucide-react";

interface BookCard2Props {
  slug: string;
  title: string;
  thumbnailUrl: string;
  handleClick?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export default function BookCard2({
  slug,
  title,
  thumbnailUrl,
  handleClick,
  isBookmarked = false,
  onToggleBookmark,
}: BookCard2Props) {
  return (
    <div
      className="relative cursor-pointer w-full group"
      onClick={handleClick}
    >
      {/* Ảnh */}
      <div className="relative rounded-xl overflow-hidden shadow-md">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Tiêu đề */}
      <h3 className="mt-2 text-sm font-semibold line-clamp-2 text-slate-800">
        {title}
      </h3>

      {/* Bookmark */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark?.();
        }}
        className="absolute top-2 right-2 z-20"
      >
        <Bookmark
          size={20}
          className={`transition-colors fill-gray-500 cursor-pointer hover:fill-yellow-400 hover:text-yellow-400 ${
            isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-gray-500"
          }`}
        />
      </button>
    </div>
  );
}
