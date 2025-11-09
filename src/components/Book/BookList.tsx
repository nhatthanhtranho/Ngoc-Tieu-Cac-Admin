"use client";
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import BookCard2 from "./BookCard";
import { useNavigate } from "react-router-dom";
import { Book } from "../../../apis/books";
import { getBannerURL } from '../../utils/getBannerURL';

export default function BookList({ initialBooks }: { initialBooks: Book[] }) {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // 🟡 Load bookmarks từ localStorage (chỉ 1 lần, defer setState)
  useEffect(() => {
    const saved = localStorage.getItem("bookmarks");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as string[];

      // 🕓 Đẩy việc setState sang microtask → tránh cascading renders
      queueMicrotask(() => {
        setBookmarks(parsed);

        // 🧩 Sort luôn tại đây
        const sortedBooks = [...initialBooks].sort((a, b) => {
          const aBookmarked = parsed.includes(a.slug);
          const bBookmarked = parsed.includes(b.slug);
          if (aBookmarked === bBookmarked) return 0;
          return aBookmarked ? -1 : 1;
        });
        setBooks(sortedBooks);
      });
    } catch (err) {
      console.error("Failed to parse bookmarks:", err);
    }
  }, [initialBooks]);

  const toggleBookmark = (slug: string) => {
    setBookmarks((prev) => {
      const isBookmarked = prev.includes(slug);
      const newBookmarks = isBookmarked
        ? prev.filter((s) => s !== slug)
        : [slug, ...prev];

      localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));

      setBooks((prevBooks) =>
        [...prevBooks].sort((a, b) => {
          const aBookmarked = newBookmarks.includes(a.slug);
          const bBookmarked = newBookmarks.includes(b.slug);
          if (aBookmarked === bBookmarked) return 0;
          return aBookmarked ? -1 : 1;
        })
      );

      return newBookmarks;
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
      {books.map((book) => (
        <motion.div
          key={book.slug}
          layout="position"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <BookCard2
            slug={book.slug}
            title={book.title}
            handleClick={() => navigate(`/book/${book.slug}`)}
            thumbnailUrl={getBannerURL(book.slug) || ""}
            isBookmarked={bookmarks.includes(book.slug)}
            onToggleBookmark={() => toggleBookmark(book.slug)}
          />
        </motion.div>
      ))}
    </div>
  );
}
