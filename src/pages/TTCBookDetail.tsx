import { useParams } from "react-router-dom";
import { BACKEND_URL } from "../constant";
import { useEffect, useState } from "react";
import { Book } from "../../apis/books";

export default function TTCBookDetail() {
    const params = useParams<{ id: string }>();
    const id = params.id || "";
    const [book, setBook] = useState<Book>();

    useEffect(() => {
        fetch(`${BACKEND_URL}/ttc/books/${id}`)
            .then((res) => res.json())
            .then((data) => setBook(data));
    }, [id]);

    if (!book) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Phần ảnh bìa */}
                <div className="flex-shrink-0">
                    <img 
                        className="w-full md:w-64 h-96 object-cover rounded-xl shadow-lg transition-transform hover:scale-[1.02]" 
                        src={`${BACKEND_URL}/ttc/image?url=${encodeURIComponent(`https://tiemtruyenchu.cloud/stories/${id}/poster.jpg`)}`} 
                        alt={book.title}
                    />
                </div>

                {/* Phần nội dung */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{book?.title}</h1>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium bg-rose-600 px-3 py-1 text-white rounded-full shadow-sm">
                            {book?.category}
                        </span>
                        <span className="text-gray-500 text-sm italic">ID: {book?.id}</span>
                    </div>

                    <div className="flex items-center gap-6 py-4 border-y border-gray-100 text-gray-700">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase font-bold">Số chương</span>
                            <span className="font-semibold text-lg">{book?.syncedChapters}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-bold text-gray-800">Giới thiệu</h3>
                        <p className="text-gray-600 leading-relaxed max-h-48 overflow-y-auto">
                            {book?.description || "Chưa có mô tả cho tác phẩm này."}
                        </p>
                    </div>

                    <button className="mt-4 w-fit bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                        Đọc ngay
                    </button>
                </div>
            </div>
        </div>
    );
}