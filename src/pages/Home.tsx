import React, { useState, useEffect } from 'react';
import { Book, fetchAllBookSlugs, fetchBookBySlugs } from '../../apis/books';
import BookList from "../components/Book/BookList";
import CreateStoryFormModal from '../components/CreateStoryModal';


function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const pageSize = 35; // số truyện mỗi trang
  const [bookSlugs, setBookSlugs] = useState<
    Array<{ slug: string; title: string }>
  >([]);

  // Load bookmark từ localStorage
  useEffect(() => {
    const savedSlugs = localStorage.getItem("bookSlugs");
    const savedBookmarks = localStorage.getItem("bookmarks");

    if (savedSlugs) {
      try {
        const parsedSlugs = JSON.parse(savedSlugs);
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Fetch books và sắp bookmark lên đầu toàn bộ danh sách
  useEffect(() => {
    // Tách bookmark và non-bookmark
    const bookmarkedSlugs = bookSlugs
      .filter((b) => bookmarks.includes(b.slug))
      .map((b) => b.slug);

    const normalSlugs = bookSlugs
      .filter((b) => !bookmarks.includes(b.slug))
      .map((b) => b.slug);

    const allSlugsOrdered = [...bookmarkedSlugs, ...normalSlugs];

    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    const slugsPage = allSlugsOrdered.slice(start, end);

    fetchBookBySlugs(slugsPage, (data) => {
      setBooks(data);
    });
  }, [currentPage, bookmarks, bookSlugs]);

  // Toggle bookmark
  const toggleBookmark = (slug: string) => {
    let updated: string[];
    if (bookmarks.includes(slug)) {
      updated = bookmarks.filter((s) => s !== slug);
    } else {
      updated = [...bookmarks, slug];
    }
    setBookmarks(updated);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
    // Khi bookmark thay đổi, tự động load lại trang 1 để ưu tiên bookmark
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(bookSlugs.length / pageSize);

  return (
    <div className="overflow-hidden">
      <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold drop-shadow-glow tracking-wide">
            ✦ Danh Sách Truyện ✦
          </h1>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-yellow-400 text-white rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            + Tạo truyện
          </button>

        </div>



        {/* Book list */}
        {books.length === 0 ? (
          <p className="text-center text-slate-500 font-noto">
            Không tìm thấy truyện nào.
          </p>
        ) : (
          <>
            <BookList initialBooks={books} />

            {/* Pagination controls */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 rounded ${currentPage === p
                    ? "bg-yellow-400 text-white"
                    : "bg-gray-200"
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </>
        )}
      </div>

      <CreateStoryFormModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false) }} />
    </div>)
}

export default App
