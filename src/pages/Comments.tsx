import { useEffect, useState } from "react";
import { api } from "../../apis";

export default function CommentList() {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const res = await api.get("/admin/real-comments");
            setComments(res.data);
        } catch (err) {
            console.error("Lỗi:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {comments.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => {
                            window.open(`https://nhatthanhtranho.github.io/Ngoc-Tieu-Cac-Admin/#/book/${item.slug}`, "_blank");
                        }}
                        className="cursor-pointer group flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
                    >
                        {/* Banner nhỏ */}
                        <div className="relative w-20 h-[120px] shrink-0 overflow-hidden bg-gray-200">
                            <img
                                src={`https://assets.ngoctieucac.com/book-cover/${item.slug}/banner-small.webp`}
                                alt="banner"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Nội dung */}
                        <div className="flex-1 p-4 flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-[2px] rounded">
                                    Comment
                                </span>
                                <span className="text-gray-300 text-[11px]">
                                    #{item.id}
                                </span>
                            </div>

                            {/* Username */}
                            <h3 className="text-base font-semibold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                                {item.username}
                            </h3>

                            {/* Nội dung comment */}
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                                {item.content}
                            </p>

                            {/* Footer */}
                            <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    <span>Đã xác minh</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/#/book/${item.slug}`, "_blank");
                                    }}
                                    className="text-indigo-500 font-medium hover:underline text-xs"
                                >
                                    Xem
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
