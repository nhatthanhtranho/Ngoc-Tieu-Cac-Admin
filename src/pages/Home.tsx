import React, { useState, useEffect, useCallback } from "react";
import {
  Book,
  fetchBookBySlugs,
  syncBookData,
} from "../../apis/books";
import BookList from "../components/Book/BookList";
import CreateStoryFormModal from "../components/CreateStoryModal";
import { StarIcon, UploadCloud, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { api } from "../../apis";
import Spinner from "../components/Spinner";
import pLimit from "p-limit";
import { toast } from "react-toastify";

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookSlugs, setBookSlugs] = useState<
    Array<{ slug: string; title: string; categories?: string[] }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [bookStatusFilter, setBookStatusFilter] = useState({
    completed: true,
    ongoing: true,
  });

  const pageSize = 100;

  const fetchAllBookSlugs = async (filter = bookStatusFilter) => {
    try {
      const res = await api.get("/books/slugs");
      let booksData = res.data;

      booksData = booksData.filter((book: any) => {
        const isCompleted = book.categories?.includes("hoan-thanh");
        if (filter.completed && filter.ongoing) return true;
        if (filter.completed) return isCompleted;
        if (filter.ongoing) return !isCompleted;
        return false;
      });

      setBookSlugs(booksData);
    } catch (err) {
      toast.error("Lỗi khi lấy danh sách slug");
    }
  };

  const toggleStatusFilter = (type: "completed" | "ongoing") => {
    setBookStatusFilter((prev) => {
      const newState = {
        ...prev,
        [type]: !prev[type],
      };
      fetchAllBookSlugs(newState);
      setCurrentPage(1);
      return newState;
    });
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await api.get("/books/slugs");
      const slugs = res.data.map((book: any) => book.slug);
      const limit = pLimit(20);
      const errorSlugs: string[] = [];

      await Promise.all(
        slugs.map((slug: string) =>
          limit(async () => {
            try {
              await syncBookData(slug);
            } catch {
              errorSlugs.push(slug);
            }
          })
        )
      );

      if (errorSlugs.length > 0) {
        toast.error(`Có ${errorSlugs.length} slug lỗi`);
      } else {
        toast.success("Sync thành công toàn bộ 🎉");
      }
    } catch {
      toast.error("Lỗi khi lấy danh sách slug");
    }
    setLoading(false);
  };

  const handleSyncCategory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/generate-category-page-data");
      const slugs = res.data.map((book: any) => book.slug);
      for (const slug of slugs) {
        await syncBookData(slug);
        await new Promise((r) => setTimeout(r, 500));
      }
      toast.success("Sync Category hoàn tất");
    } catch {
      toast.error("Lỗi Sync Category");
    }
    setLoading(false);
  };

  const generateRelativeBook = async () => {
    setLoading(true);
    try {
      await api.get("/admin/gemnerateRelativeBook");
      toast.success("Đã cập nhật sách liên quan");
    } catch {
      toast.error("Lỗi khi tạo sách liên quan");
    }
    setLoading(false);
  };

  useEffect(() => {
    const savedSlugs = localStorage.getItem("bookSlugs");
    const savedBookmarks = localStorage.getItem("bookmarks");
    document.title = "Ngọc Tiêu Các";

    if (savedSlugs) {
      try {
        const parsed = JSON.parse(savedSlugs);
        if (Array.isArray(parsed)) setBookSlugs(parsed);
      } catch {}
    } else {
      fetchAllBookSlugs();
    }

    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch {}
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    let filteredSlugs = bookSlugs;

    if (searchKeyword.trim() !== "") {
      const keyword = searchKeyword.toLowerCase().replace(/\s+/g, "");
      filteredSlugs = bookSlugs.filter((b) => {
        const title = b.title.toLowerCase().replace(/\s+/g, "");
        const slug = b.slug.toLowerCase().replace(/\s+/g, "");
        return title.includes(keyword) || slug.includes(keyword);
      });
    }

    const bookmarkedSlugs = filteredSlugs
      .filter((b) => bookmarks.includes(b.slug))
      .map((b) => b.slug);

    const normalSlugs = filteredSlugs
      .filter((b) => !bookmarks.includes(b.slug))
      .map((b) => b.slug);

    const allSlugsOrdered = [...bookmarkedSlugs, ...normalSlugs];
    const start = (currentPage - 1) * pageSize;
    const slugsPage = allSlugsOrdered.slice(start, start + pageSize);

    if (slugsPage.length > 0) {
      fetchBookBySlugs(slugsPage, (data) => setBooks(data)).finally(() =>
        setLoading(false)
      );
    } else {
      setBooks([]);
      setLoading(false);
    }
  }, [currentPage, bookmarks, bookSlugs, searchKeyword]);

  const addNewBook = useCallback((book: any) => {
    setBooks((prev) => [book, ...prev]);
  }, []);

  const totalPages = Math.ceil(bookSlugs.length / pageSize);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Spinner show={loading} />

      <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
              Danh Sách Truyện
            </h1>
            <p className="text-gray-500">Quản lý và đồng bộ dữ liệu thư viện</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleSyncCategory} 
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-sm transition-all active:scale-95 font-medium flex items-center gap-2"
            >
              Category
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition-all active:scale-95 font-medium flex items-center gap-2"
            >
              <Plus size={20} /> Tạo truyện
            </button>

            <button 
              onClick={handleSync} 
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all active:scale-95 font-medium flex items-center gap-2"
            >
              <UploadCloud size={18} /> Sync Toàn Bộ
            </button>

            <button
              onClick={generateRelativeBook}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-sm transition-all active:scale-95 font-medium flex items-center gap-2"
            >
              <StarIcon size={18} /> Sách Theo Tác Giả
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Status Filter Toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full lg:w-auto">
              <button
                onClick={() => toggleStatusFilter("completed")}
                className={`flex-1 lg:w-32 py-2 px-4 rounded-lg font-medium transition-all ${
                  bookStatusFilter.completed 
                  ? "bg-white text-emerald-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Hoàn Thành
              </button>
              <button
                onClick={() => toggleStatusFilter("ongoing")}
                className={`flex-1 lg:w-32 py-2 px-4 rounded-lg font-medium transition-all ${
                  bookStatusFilter.ongoing 
                  ? "bg-white text-emerald-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Đang Ra
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <input
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm tên truyện hoặc slug..."
                className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="min-h-[400px]">
          <BookList initialBooks={books} loading={loading} />
        </div>

        {/* Pagination Section */}
        {!searchKeyword && totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12 pb-10">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-11 h-11 rounded-xl font-bold transition-all ${
                    currentPage === p 
                    ? "bg-amber-400 text-white shadow-lg shadow-amber-200 scale-110" 
                    : "bg-white border border-gray-100 text-gray-500 hover:border-amber-300 hover:text-amber-500"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-90"
            >
              <ChevronRight size={20} />
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

