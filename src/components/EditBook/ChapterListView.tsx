import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { se, vi } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, BrushCleaning, SortAsc } from "lucide-react";

import UploadChaptersModal from "./UploadChaptersModal";
import { Chapter, fetchChapters } from "../../../apis/chapters";
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    fetchChapters(bookSlug, setChapters);
  }, [bookSlug]);


  const sortChapter = () => {
    setChapters((prev) => {
      const sorted = [...prev].reverse()
      return sorted;
    })
  }

  const handleUploaded = async () => {
    setShowUploadModal(false);
    await fetchChapters(bookSlug, setChapters);
    setError(null);
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
            onClick={() => sortChapter()}
            className="bg-gray-600 rounded p-2 cursor-pointer hover:bg-gray-900 transition-colors duration-200 shadow text-white"
          >
            <SortAsc className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 rounded p-2 cursor-pointer hover:bg-red-800 transition-colors duration-200 shadow text-white"
          >
            <BrushCleaning className="w-6 h-6" />
          </button>
        
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 rounded p-2 cursor-pointer hover:bg-blue-800 transition-colors duration-200 shadow text-white"
          >
            <Upload className="w-6 h-6" />
          </button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {chapters.length === 0 ? (
        <p>Không có chương nào.</p>
      ) : (
        <ul className="divide-y max-h-250 overflow-y-scroll divide-gray-200 gap-2">
          {chapters.map((chapter) => (
            <li
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/book/${bookSlug}/chapter/${chapter.chapterNumber}`);
              }}
              key={chapter.chapterNumber}
              className={`py-3 cursor-pointer px-4 flex justify-between items-center rounded-lg 0 mb-1  ${chapter.isQualified
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

      {/* Popup Upload */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadChaptersModal
            bookSlug={bookSlug}
            onClose={() => setShowUploadModal(false)}
            onUploaded={handleUploaded}
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
