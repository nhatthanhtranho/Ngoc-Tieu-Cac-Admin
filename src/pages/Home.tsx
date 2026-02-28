import React, { useState, useEffect, useCallback } from "react";
import { Book, fetchAllBookSlugs, fetchBookBySlugs, syncBookData } from "../../apis/books";
import BookList from "../components/Book/BookList";
import CreateStoryFormModal from "../components/CreateStoryModal";
import { StarIcon, UploadCloud } from "lucide-react";
import { api } from "../../apis";
import Spinner from '../components/Spinner'
import pLimit from "p-limit"
import { toast } from "react-toastify";

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
      fetchAllBookSlugs(setBookSlugs, newStatus as any);
      setCurrentPage(1);

      return newStatus;
    });
  };

  const handleSync = async () => {
    setLoading(true)

    try {
      const books = (await api.get("/books/slugs")).data
      const slugs = books.map((book: any) => book.slug)

      const limit = pLimit(20)

      const errorSlugs: string[] = []

      await Promise.all(
        slugs.map((slug: string) =>
          limit(async () => {
            try {
              await syncBookData(slug)
              console.log("done", slug)
            } catch (err) {
              console.error("error:", slug)
              errorSlugs.push(slug) // 👈 lưu slug lỗi
            }
          })
        )
      )

      // 👇 Sau khi chạy xong hết
      if (errorSlugs.length > 0) {
        toast.error(
          `Có ${errorSlugs.length} slug lỗi`,
        )

        // nếu muốn show full list
        toast.info(errorSlugs.join(", "))
      } else {
        toast.success("Sync thành công toàn bộ 🎉")
      }

    } catch (err) {
      toast.error("Lỗi khi lấy danh sách slug")
    }

    setLoading(false)
  }

  const handleSyncCategory = async () => {
    setLoading(true)
    const books = (await api.get('/admin/generate-category-page-data')).data
    const slugs = books.map((book: any) => book.slug)

    for (const slug of slugs) {
      await syncBookData(slug)
      console.log('done', slug)
      await new Promise(r => setTimeout(r, 500))
    }
    setLoading(false)
  }


  const generateRelativeBook = async () => {
    setLoading(true)
    await api.get('/admin/gemnerateRelativeBook')
    setLoading(false)
  }


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
      <Spinner show={loading} />
      <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold drop-shadow-glow tracking-wide">
            Danh Sách Truyện
          </h1>
          <div className="flex flex-row gap-4">
            <button
              onClick={() => handleSyncCategory()}
              className="px-4 py-2 bg-red-400 text-white rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              Category
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-yellow-400 text-white rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              + Tạo truyện
            </button>
            <button
              onClick={() => handleSync()}
              className="flex flex-row px-4 py-2 bg-green-400 text-white rounded-lg font-semibold hover:bg-green-500 transition-colors"
            >
              <UploadCloud />
              Sync
            </button>

            <button
              onClick={() => generateRelativeBook()}
              className="flex flex-row px-4 py-2 bg-blue-400 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
            >
              <StarIcon />
              Tạo Sách Theo Tác Giả
            </button>
          </div>


        </div>
        <div className="flex gap-2 my-5">
          <button
            onClick={() => toggleStatusFilter("hoan-thanh")}
            className={`text-white py-2 w-32 rounded shadow cursor-pointer ${bookStatusFilter.includes("hoan-thanh")
              ? "bg-emerald-500"
              : "bg-gray-400"
              }`}
          >
            Hoàn Thành
          </button>
          <button
            onClick={() => toggleStatusFilter("dang-ra")}
            className={`text-white py-2 w-32 rounded shadow cursor-pointer ${bookStatusFilter.includes("dang-ra")
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
                className={`px-3 py-1 rounded ${currentPage === p ? "bg-yellow-400 text-white" : "bg-gray-200"
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
