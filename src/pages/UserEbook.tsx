import { useEffect, useState, useMemo } from "react";
import { Book } from "../../apis/books";
import BookList from "../components/Book/BookList";
import { api, getEndpoint } from "../../apis";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";
import axios from "axios";

type FilterType = "all" | "no-ebook";

function UserEbook() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("no-ebook");

  const fetchUserEbook = async () => {
    try {
      setLoading(true);

      const res = await api.get("/admin/user-ebook");
      console.log("User Ebook Response:", res.data);

      const slugs = res.data.ebooks;

      const bookRes = await axios.post<Book[]>(getEndpoint("books/slugs"), {
        slugs,
      });

      console.log("book Response:", bookRes.data);

      setBooks(bookRes.data);
    } catch (err) {
      toast.error("Lỗi khi lấy user ebook");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEbook();
  }, []);

  const filteredBooks = useMemo(() => {
    if (filter === "all") return books;

    return books.filter((b: any) => !b?.hasEbook); // sửa field theo API
  }, [books, filter]);

  return (
    <div className="overflow-hidden">
      <Spinner show={loading} />

      <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold tracking-wide">
            Danh Sách Truyện
          </h1>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("no-ebook")}
              className={`px-4 py-2 rounded-lg border transition ${
                filter === "no-ebook"
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              Chưa Có Ebook
            </button>

            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg border transition ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              Tất Cả
            </button>
          </div>
        </div>

        <BookList initialBooks={filteredBooks} loading={loading} />
      </div>
    </div>
  );
}

export default UserEbook;