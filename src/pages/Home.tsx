import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { PlaySquare } from 'lucide-react';

import { Book, fetchAllBookSlugs, fetchBookBySlugs } from '../../apis/books';
import BookList from "../components/BookCard2/BookList";

function CreateButton() {
  const navigate = useNavigate();
  return (
    <div className="flex justify-end mb-6 gap-2">
      <button
        className="px-2 py-3 bg-gray-800 text-white rounded-lg cursor-pointer shadow"
        onClick={() => navigate("/leaderboard")}
      >
        Sắp xếp leaderboard
      </button>

      <button
        onClick={() => navigate("/create-book")}
        className="
          flex items-center gap-2 font-genshin
          bg-gradient-to-r from-[#fcd34d] via-[#fbbf24] to-[#f59e0b]
          text-white px-6 py-2.5 rounded-xl
          shadow-[0_0_12px_rgba(251,191,36,0.6)]
          border border-yellow-400/40
          transition-all duration-300
          hover:scale-105 hover:shadow-[0_0_20px_rgba(251,191,36,0.8)]
          active:scale-95
        "
      >
        <PlaySquare size={20} color="white" />
        Tạo truyện mới
      </button>
    </div>
  );
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookSlugs, setBookSlugs] = useState<Array<{ slug: string; title: string }>>([]);
  const pageSize = 35;

  // Load slugs & bookmarks from localStorage
  useEffect(() => {
    const savedSlugs = localStorage.getItem("bookSlugs");
    const savedBookmarks = localStorage.getItem("bookmarks");

    if (savedSlugs) {
      try {
        const parsedSlugs = JSON.parse(savedSlugs);
        if (Array.isArray(parsedSlugs)) setBookSlugs(parsedSlugs);
      } catch {
        console.error("Lỗi khi parse bookSlugs từ localStorage");
      }
    } else {
      fetchAllBookSlugs(setBookSlugs);
    }

    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch {
        console.error("Lỗi khi parse bookmarks từ localStorage");
      }
    }
  }, []);

  // Compute ordered slugs (bookmark first)
  const orderedSlugs = React.useMemo(() => {
    const bookmarked = bookSlugs.filter(b => bookmarks.includes(b.slug));
    const normal = bookSlugs.filter(b => !bookmarks.includes(b.slug));
    return [...bookmarked, ...normal];
  }, [bookSlugs, bookmarks]);

  const totalPages = Math.ceil(orderedSlugs.length / pageSize);

  // Fetch books for current page
  useEffect(() => {
    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    const pageSlugs = orderedSlugs.slice(start, end).map(b => b.slug);

    if (pageSlugs.length === 0) {
      setBooks([]);
      return;
    }
    fetchBookBySlugs(pageSlugs, setBooks);
  }, [currentPage, orderedSlugs]);

  // Toggle bookmark
  const toggleBookmark = (slug: string) => {
    let updated: string[];
    if (bookmarks.includes(slug)) {
      updated = bookmarks.filter(s => s !== slug);
    } else {
      updated = [...bookmarks, slug];
    }
    setBookmarks(updated);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setCurrentPage(1); // Reset to page 1
  };

  // Pagination rendering helper
  const renderPagination = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) pages.push(1, '...');
    for (let p = startPage; p <= endPage; p++) pages.push(p);
    if (endPage < totalPages) pages.push('...', totalPages);

    return pages.map((p, idx) =>
      typeof p === 'number' ? (
        <button
          key={idx}
          onClick={() => setCurrentPage(p)}
          className={`px-3 py-1 rounded ${currentPage === p ? "bg-yellow-400 text-white" : "bg-gray-200"}`}
        >
          {p}
        </button>
      ) : (
        <span key={idx} className="px-2 py-1 text-gray-500">{p}</span>
      )
    );
  };

  return (
    <div className="overflow-hidden">
      <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-genshin drop-shadow-glow tracking-wide">
            ✦ Danh Sách Truyện ✦
          </h1>
          <CreateButton />
        </div>

        {/* Book list */}
        {books.length === 0 ? (
          <p className="text-center text-slate-500 font-noto">
            Không tìm thấy truyện nào.
          </p>
        ) : (
          <>
            <BookList books={books} />

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Trước
              </button>

              {renderPagination()}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
