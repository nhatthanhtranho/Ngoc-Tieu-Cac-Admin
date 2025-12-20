import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, Download, BrushCleaning } from "lucide-react";

import UploadChaptersModal from "./UploadChaptersModal";
import UploadFreeModal from "./UploadFreeModal";
import { Chapter, fetchChapters } from "../../../apis/chapters";
import DownloadBookModal from "./DownloadBookModal";
import InlinePageInput from "./InlinePageInput";
import DeleteBookModal from "./DeleteBookModal";
interface ChapterListViewProps {
  numberOfChapters: number;
  bookSlug: string;
}

function renderDate(date: string) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: vi,
  });
}

export default function ChapterListView({
  numberOfChapters,
  bookSlug,
}: ChapterListViewProps) {
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(""); // ✅ trang nhập thủ công
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadFreeModal, setShowUploadFreeModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  const pageSize = 10;
  const totalPages = Math.ceil(numberOfChapters / pageSize);

  useEffect(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    fetchChapters(bookSlug, start, end, setChapters, "desc");
  }, [bookSlug, page]);

  const handleUploaded = async () => {
    setShowUploadModal(false);
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    await fetchChapters(bookSlug, start, end, setChapters);
    setError(null);
  };

  const handleJumpPage = () => {
    const newPage = parseInt(inputPage, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setInputPage("");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Danh sách chương ({numberOfChapters})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 rounded p-2 cursor-pointer hover:bg-red-800 transition-colors duration-200 shadow text-white"
          >
            <BrushCleaning className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="bg-green-600 rounded p-2 cursor-pointer hover:bg-green-800 transition-colors duration-200 shadow text-white"
          >
            <Download className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 rounded p-2 cursor-pointer hover:bg-blue-800 transition-colors duration-200 shadow text-white"
          >
            <Upload className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowUploadFreeModal(true)}
            className="bg-fuchsia-600 rounded p-2 flex gap-2 cursor-pointer hover:bg-fuchsia-800 transition-colors duration-200 shadow text-white"
          >
            <Upload className="w-6 h-6" /> Free
          </button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {chapters.length === 0 ? (
        <p>Không có chương nào.</p>
      ) : (
        <ul className="divide-y divide-gray-200 gap-2">
          {chapters.map((chapter) => (
            <li
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/book/${bookSlug}/chapter/${chapter.chapterNumber}`);
              }}
              key={chapter.chapterNumber}
              className={`py-3 cursor-pointer px-4 flex justify-between items-center rounded-lg 0 mb-1  ${
                chapter.isQualified
                  ? " bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-gray-50 hover:bg-gray-200"
              }`}
            >
              <div className="flex flex-col">
                <p className="font-semibold flex items-center gap-2">
                  Chương {chapter.chapterNumber}:{" "}
                  <span className="font-normal">{chapter.title}</span>
                </p>
                <p className="text-sm italic">
                  Cập nhật:{" "}
                  {renderDate(chapter.createdAt || new Date().toDateString())}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
              page === 1
                ? "text-gray-400 border-gray-300 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                : "text-gray-700 dark:text-gray-200 border-gray-300 hover:bg-green-500 hover:text-white"
            }`}
          >
            ← Trước
          </button>

          {/* ✅ Trang hiện tại — click để chỉnh sửa */}
          <InlinePageInput
            currentPage={page}
            totalPages={totalPages}
            onChange={(newPage: any) => setPage(newPage)}
          />

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
              page === totalPages
                ? "text-gray-400 border-gray-300 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                : "text-gray-700 dark:text-gray-200 border-gray-300 hover:bg-green-500 hover:text-white"
            }`}
          >
            Sau →
          </button>
        </div>
      )}

      {/* Popup Upload */}
      <AnimatePresence>
        {showUploadFreeModal && (
          <UploadChaptersModal
            bookSlug={bookSlug}
            onClose={() => setShowUploadModal(false)}
            onUploaded={handleUploaded}
          />
        )}

        {showUploadFreeModal && (
          <UploadFreeModal
            bookSlug={bookSlug}
            onClose={() => setShowUploadFreeModal(false)}
            onUploaded={handleUploaded}
          />
        )}

        {showDownloadModal && (
          <DownloadBookModal
            totalChapters={numberOfChapters}
            key="download-modal"
            bookSlug={bookSlug}
            onClose={() => setShowDownloadModal(false)}
          />
        )}
        {showDeleteModal && (
          <DeleteBookModal
            bookSlug={bookSlug}
            onClose={() => setShowDeleteModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
