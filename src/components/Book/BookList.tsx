"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import BookCard2 from "./BookCard";
import { Book } from "../../../apis/books";
import { getBannerURL } from "../../utils/getBannerURL";
import Skeleton from "react-loading-skeleton";

export default function BookList({
  initialBooks,
  loading,
}: {
  initialBooks: Book[];
  loading: boolean;
}) {

  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // 🟡 Load bookmarks từ localStorage (chạy 1 lần khi mount)
  useEffect(() => {
    const saved = localStorage.getItem("bookmarks");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as string[];
      setBookmarks(parsed);
    } catch (err) {
      console.error("Failed to parse bookmarks:", err);
    }
  }, []);

  // 🧩 Khi initialBooks hoặc bookmarks thay đổi → sort lại books
  useEffect(() => {
    if (!initialBooks) return;
    const sortedBooks = [...initialBooks].sort((a, b) => {
      const aBookmarked = bookmarks.includes(a.slug);
      const bBookmarked = bookmarks.includes(b.slug);
      if (aBookmarked === bBookmarked) return 0;
      return aBookmarked ? -1 : 1;
    });
    setBooks(sortedBooks);
  }, [initialBooks, bookmarks]);

  // 🧩 Toggle bookmark và lưu vào localStorage
  const toggleBookmark = (slug: string) => {
    setBookmarks((prev) => {
      const isBookmarked = prev.includes(slug);
      const newBookmarks = isBookmarked
        ? prev.filter((s) => s !== slug)
        : [slug, ...prev];

      localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  // 🧱 Render UI
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
      {loading
        ? // ⭐ Skeleton Loading UI
          Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <Skeleton className="rounded-lg aspect-2/3" />
              <Skeleton height={20} />
            </div>
          ))
        : books.map((book) => (
            <motion.div
              key={book.slug}
              layout="position"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <BookCard2
                slug={book.slug}
                currentChapter={book.currentChapter || 0}
                title={`${book.title}`}
                handleClick={() => window.open(`/Ngoc-Tieu-Cac-Admin/#/book/${book.slug}`, "_blank", "noopener,noreferrer")}
                thumbnailUrl={getBannerURL(book.slug) || ""}
                isBookmarked={bookmarks.includes(book.slug)}
                onToggleBookmark={() => toggleBookmark(book.slug)}
                hasEbook={book.hasEbook}
                latestEbook={book.currentChapter == book.currentEbookChapter}
              />
            </motion.div>
          ))}
    </div>
  );
}
