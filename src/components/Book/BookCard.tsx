"use client";
import { Book as BookIcon, Bookmark, Sprout } from "lucide-react";

interface BookCardProps {
  slug: string;
  title: string;
  currentChapter: number;
  thumbnailUrl: string;
  handleClick?: () => void;
  isBookmarked?: boolean;
  hasEbook?: boolean;
  latestEbook?: boolean
  onToggleBookmark?: () => void;
  isSeed?: boolean
}

export default function BookCard({
  title,
  thumbnailUrl,
  handleClick,
  isBookmarked = false,
  latestEbook = false,
  hasEbook = false,
  currentChapter,
  isSeed,

  onToggleBookmark,
}: BookCardProps) {
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
          className="w-full aspect-2/3 object-cover group-hover:scale-105 transition-transform duration-300"
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
          className={`transition-colors fill-gray-500 cursor-pointer hover:fill-yellow-400 hover:text-yellow-400 ${isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-gray-500"
            }`}
        />
      </button>

      <div
        className={`absolute top-2 right-10 z-20 px-2 py-0.5
              text-white text-[11px] font-medium rounded-md 
              backdrop-blur-sm shadow-sm
              ${currentChapter === 0
            ? "bg-red-600"
            : "bg-black/70"
          }`}
      >
        Ch.{currentChapter}
      </div>

      {hasEbook &&

        <button

          className="absolute top-2  left-2 z-20"
        >
          <BookIcon
            size={24}
            className={`transition-colors cursor-pointer ${latestEbook ? "text-emerald-500 fill-emerald-300" : "text-yellow-500 fill-yellow-300 "
              }`}
          />
        </button>
      }

      {isSeed && (
        <button
          className="
      absolute top-10 left-2 z-20
      flex items-center justify-center
      w-9 h-9
      rounded-full
      bg-green-50
      shadow-md
      hover:bg-green-100
      active:scale-95
      transition-all
    "
          title="Seed chapter"
        >
          <Sprout size={18} className="text-green-600" />
        </button>
      )}
    </div>
  );
}
