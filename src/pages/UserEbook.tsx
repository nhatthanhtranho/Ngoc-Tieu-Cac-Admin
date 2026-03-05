import { useEffect, useState } from "react";
import {
  Book,
  fetchBookBySlugs,
} from "../../apis/books";
import BookList from "../components/Book/BookList";
import { api, getEndpoint } from "../../apis";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";
import axios from "axios";

function UserEbook() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserEbook = async () => {
    try {
      setLoading(true)
      const res = await api.get("/admin/user-ebook");
      console.log("User Ebook Response:", res.data); // Debug log
      const slugs = res.data.ebooks
      const bookRes = await axios.post<Book[]>(getEndpoint("books/slugs"), {
        slugs,
      });

      console.log("book Response:", bookRes.data); // Debug log

      setBooks(bookRes.data);
      setLoading(false);
    } catch (err) {
      toast.error("Lỗi khi lấy user ebook");
    }
    finally {
      setLoading(false)
    }
  };


  useEffect(() => {
    fetchUserEbook()
  }, [])


  return (
    <div className="overflow-hidden">
      <Spinner show={loading} />

      <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold tracking-wide">
            Danh Sách Truyện
          </h1>
        </div>
        <BookList initialBooks={books} loading={loading} /> 
      </div>


    </div>
  );
}

export default UserEbook;
