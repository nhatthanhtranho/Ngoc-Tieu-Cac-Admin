"use client";
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import BookCard2 from "./BookCard2";
import { useNavigate } from "react-router-dom";
import { Book } from "../../../apis/books";

export default function BookList({ books }: { books: Book[] }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const navigate = useNavigate()

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
            thumbnailUrl={book.bannerURL || ""}
            isBookmarked={bookmarks.includes(book.slug)}
            onToggleBookmark={() => toggleBookmark(book.slug)}
          />
        </motion.div>
      ))}
    </div>
  );
}
