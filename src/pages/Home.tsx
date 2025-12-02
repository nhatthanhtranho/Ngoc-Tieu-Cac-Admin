import React, { useState, useEffect, useCallback } from "react";
import { Book, fetchAllBookSlugs, fetchBookBySlugs } from "../../apis/books";
import BookList from "../components/Book/BookList";
import CreateStoryFormModal from "../components/CreateStoryModal";

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookSlugs, setBookSlugs] = useState<
    Array<{ slug: string; title: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [bookStatusFilter, setBookStatusFilter] = useState<string[]>([
    "hoan-thanh",
    "dang-ra",
  ]);
  const pageSize = 100;

  const toggleStatusFilter = async (status: string) => {
    setBookStatusFilter((prev) => {
      let newStatus: string[];

      if (prev.includes(status)) {
        // Nếu đã có → bỏ
        newStatus = prev.filter((s) => s !== status);
      } else {
        // Nếu chưa có → thêm
        newStatus = [...prev, status];
      }

      // Fetch ngay theo giá trị mới
      fetchAllBookSlugs(setBookSlugs, newStatus);
      setCurrentPage(1);

      return newStatus;
    });
  };

  // Load bookmark từ localStorage
  useEffect(() => {
    const savedSlugs = localStorage.getItem("bookSlugs");
    const savedBookmarks = localStorage.getItem("bookmarks");
    document.title = "Ngọc Tiêu Các";

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

  // Fetch books theo bookmark / page / search
  useEffect(() => {
    setLoading(true);

    // Lọc theo searchKeyword
    let filteredSlugs = bookSlugs;
    if (searchKeyword.trim() !== "") {
      const keyword = searchKeyword.toLowerCase().replace(/\s+/g, ""); // loại bỏ space để match slug/title

      filteredSlugs = bookSlugs.filter((b) => {
        const titleNormalized = b.title.toLowerCase().replace(/\s+/g, "");
        const slugNormalized = b.slug.toLowerCase().replace(/\s+/g, "");
        return (
          titleNormalized.includes(keyword) || slugNormalized.includes(keyword)
        );
      });
    }

    // Sắp bookmark lên đầu
    const bookmarkedSlugs = filteredSlugs
      .filter((b) => bookmarks.includes(b.slug))
      .map((b) => b.slug);

    const normalSlugs = filteredSlugs
      .filter((b) => !bookmarks.includes(b.slug))
      .map((b) => b.slug);

    const allSlugsOrdered = [...bookmarkedSlugs, ...normalSlugs];

    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    const slugsPage = allSlugsOrdered.slice(start, end);

    if (slugsPage.length > 0)
      fetchBookBySlugs(slugsPage, (data) => setBooks(data)).finally(() =>
        setLoading(false)
      );
    else setBooks([]); // không có kết quả
    setLoading(false);
  }, [currentPage, bookmarks, bookSlugs, searchKeyword]);

  const addNewBook = useCallback(
    (book: any) => {
      setBooks((prevBooks) => [book, ...prevBooks]);
    },
    [setBooks]
  );
  const totalPages = Math.ceil(bookSlugs.length / pageSize);

  return (
    <div className="overflow-hidden">
      <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold drop-shadow-glow tracking-wide">
            Danh Sách Truyện
          </h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-yellow-400 text-white rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            + Tạo truyện
          </button>
        </div>
        <div className="flex gap-2 my-5">
          <button
            onClick={() => toggleStatusFilter("hoan-thanh")}
            className={`text-white py-2 w-32 rounded shadow cursor-pointer ${
              bookStatusFilter.includes("hoan-thanh")
                ? "bg-emerald-500"
                : "bg-gray-400"
            }`}
          >
            Hoàn Thành
          </button>
          <button
            onClick={() => toggleStatusFilter("dang-ra")}
            className={`text-white py-2 w-32 rounded shadow cursor-pointer ${
              bookStatusFilter.includes("dang-ra")
                ? "bg-emerald-500"
                : "bg-gray-400"
            }`}
          >
            Đang Ra
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm truyện..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <BookList initialBooks={books} loading={loading} />

        {/* Pagination */}
        {!searchKeyword && (
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
                className={`px-3 py-1 rounded ${
                  currentPage === p ? "bg-yellow-400 text-white" : "bg-gray-200"
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
        )}
      </div>

      <CreateStoryFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={addNewBook}
      />
    </div>
  );
}

export default App;
