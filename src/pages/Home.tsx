import React, { useState, useEffect, useCallback } from "react";
import {
  Book,
  fetchBookBySlugs,
  syncBookData,
} from "../../apis/books";
import BookList from "../components/Book/BookList";
import CreateStoryFormModal from "../components/CreateStoryModal";
import { StarIcon, UploadCloud } from "lucide-react";
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

  // ✅ NEW: dùng boolean thay vì string
  const [bookStatusFilter, setBookStatusFilter] = useState({
    completed: true,
    ongoing: true,
  });

  const pageSize = 100;

  // ✅ fetch + filter đúng logic
  const fetchAllBookSlugs = async (filter = bookStatusFilter) => {
    try {
      const res = await api.get("/books/slugs");
      let books = res.data;

      books = books.filter((book: any) => {
        const isCompleted = book.categories?.includes("hoan-thanh");

        if (filter.completed && filter.ongoing) return true;
        if (filter.completed) return isCompleted;
        if (filter.ongoing) return !isCompleted;

        return false;
      });

      setBookSlugs(books);
    } catch (err) {
      toast.error("Lỗi khi lấy danh sách slug");
    }
  };

  // toggle filter
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
      const books = (await api.get("/books/slugs")).data;
      const slugs = books.map((book: any) => book.slug);

      const limit = pLimit(20);
      const errorSlugs: string[] = [];

      await Promise.all(
        slugs.map((slug: string) =>
          limit(async () => {
            try {
              await syncBookData(slug);
              console.log("done", slug);
            } catch {
              errorSlugs.push(slug);
            }
          })
        )
      );

      if (errorSlugs.length > 0) {
        toast.error(`Có ${errorSlugs.length} slug lỗi`);
        toast.info(errorSlugs.join(", "));
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
    const books = (await api.get("/admin/generate-category-page-data")).data;
    const slugs = books.map((book: any) => book.slug);

    for (const slug of slugs) {
      await syncBookData(slug);
      console.log("done", slug);
      await new Promise((r) => setTimeout(r, 500));
    }

    setLoading(false);
  };

  const generateRelativeBook = async () => {
    setLoading(true);
    await api.get("/admin/gemnerateRelativeBook");
    setLoading(false);
  };

  // load localStorage + init data
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

  // fetch books theo page/search
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
    const end = currentPage * pageSize;
    const slugsPage = allSlugsOrdered.slice(start, end);

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
    <div className="overflow-hidden">
      <Spinner show={loading} />

      <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold">Danh Sách Truyện</h1>

          <div className="flex gap-4">
            <button onClick={handleSyncCategory} className="btn bg-red-400">
              Category
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn bg-yellow-400"
            >
              + Tạo truyện
            </button>

            <button onClick={handleSync} className="btn bg-green-400 flex gap-2">
              <UploadCloud /> Sync
            </button>

            <button
              onClick={generateRelativeBook}
              className="btn bg-blue-400 flex gap-2"
            >
              <StarIcon /> Tạo Sách Theo Tác Giả
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 my-5">
          <button
            onClick={() => toggleStatusFilter("completed")}
            className={`w-32 py-2 rounded text-white ${
              bookStatusFilter.completed ? "bg-emerald-500" : "bg-gray-400"
            }`}
          >
            Hoàn Thành
          </button>

          <button
            onClick={() => toggleStatusFilter("ongoing")}
            className={`w-32 py-2 rounded text-white ${
              bookStatusFilter.ongoing ? "bg-emerald-500" : "bg-gray-400"
            }`}
          >
            Đang Ra
          </button>
        </div>

        {/* Search */}
        <input
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Tìm truyện..."
          className="w-full p-3 border rounded-lg mb-6"
        />

        <BookList initialBooks={books} loading={loading} />

        {/* Pagination */}
        {!searchKeyword && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={
                  `py-1 px-3 ${currentPage === p ? "bg-yellow-400 text-white" : "bg-gray-200"}`
                }
              >
                {p}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
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