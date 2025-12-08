/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import BookSwiper from "../Book/BookSwiper";
import BookCard from "../Book/BookCard";
import { useEffect, useState } from "react";
import { Book, fetchBookBySlugs } from "../../../apis/books";
import { getSmallBannerURL } from "../../utils/getBannerURL";
import { useNavigate } from "react-router-dom";

interface TopTruyenProps {
  className?: string;
  bookSlugs: string[];
  renderMore?: number;
}

export default function TopTruyen({
  bookSlugs,
  className,
  renderMore = 0,
}: TopTruyenProps) {
  const [books, setBooks] = useState<Book[]>([]);
  useEffect(() => {
    if (bookSlugs.length > 0) fetchBookBySlugs(bookSlugs, setBooks);
  }, [bookSlugs]);
  const navigate = useNavigate();
  // 🧩 Empty state
  if (!books || books?.length === 0)
    return (
      <div className="text-gray-500 text-center py-10">Không có dữ liệu</div>
    );

  // 🧩 Hiển thị danh sách
  return (
    <div className={className || ""}>
      <BookSwiper renderMore={renderMore}>
        {books.map((book) => (
          <BookCard
            slug={book.slug}
            key={book.slug}
            title={book.title}
            currentChapter={book.currentChapter}
            thumbnailUrl={getSmallBannerURL(book.slug)}
            handleClick={() => window.open(`/#/book/${book.slug}`, "_blank", "noopener,noreferrer")}
          />
        ))}
      </BookSwiper>
    </div>
  );
}
