import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Book } from "../../apis/books";
import BookList from "../components/Book/BookList";
import Spinner from "../components/Spinner";
import { BACKEND_URL } from "../constant";

interface BooksResponse {
    books: Book[];
    total: number;
    page: number;
    totalPages: number;
}

function App() {
    const [books, setBooks] = useState<Book[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [totalPages, setTotalPages] = useState(1);

    const pageSize = 100;

    const fetchBooks = async () => {
        try {
            setLoading(true);

            const res = await axios.get<BooksResponse>(`${BACKEND_URL}/ttc/books`, {
                params: {
                    page: currentPage,
                    limit: pageSize,
                    search: searchKeyword.trim(),
                },
            });

            setBooks(res.data.books || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (error) {
            console.error("Fetch books error:", error);
            setBooks([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Ngọc Tiêu Các";
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchBooks();
        }, 300);

        return () => clearTimeout(timeout);
    }, [currentPage, searchKeyword]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Spinner show={loading} />

            <div className="container mx-auto px-4 py-10 font-genshin text-genshin-dark">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                        Danh Sách Truyện
                    </h1>
                    <p className="text-gray-500">
                        Tìm kiếm và quản lý danh sách truyện
                    </p>
                </div>

                {/* Search */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
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

                {/* List */}
                <div className="min-h-[400px]">
                    <BookList initialBooks={books} loading={loading} isTiemTruyenChu />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-12 pb-10">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-90"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex gap-2 flex-wrap justify-center">
                            {Array.from(
                                { length: Math.min(totalPages, 10) },
                                (_, i) => {
                                    let page;

                                    if (totalPages <= 10) {
                                        page = i + 1;
                                    } else {
                                        const start = Math.max(
                                            1,
                                            Math.min(currentPage - 4, totalPages - 9)
                                        );
                                        page = start + i;
                                    }

                                    return page;
                                }
                            ).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-11 h-11 rounded-xl font-bold transition-all ${currentPage === page
                                            ? "bg-amber-400 text-white shadow-lg shadow-amber-200 scale-110"
                                            : "bg-white border border-gray-100 text-gray-500 hover:border-amber-300 hover:text-amber-500"
                                        }`}
                                >
                                    {page}
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
        </div>
    );
}

export default App;