import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { vi } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, SquarePen, Download, BrushCleaning } from "lucide-react";

import UploadChaptersModal from "./UploadChaptersModal";
import ReviewChapterModal from "./ReviewChapterModal";
import { Chapter, fetchChapters } from "../../../apis/chapters";
import { downloadBooks } from "../../../apis/books";

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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number>(-1);
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState<{
    [chapterNumber: number]: { isFormatOk: boolean; isQualityOk: boolean };
  }>({});

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const res = await axios.get("/api/review-progress");
        const formatFile =
          res.data?.[`${bookSlug}-format-review-progress.txt`] || {};
        const qualityFile =
          res.data?.[`${bookSlug}-quality-review-progress.txt`] || {};

        const combined: {
          [chapterNumber: number]: {
            isFormatOk: boolean;
            isQualityOk: boolean;
          };
        } = {};
        for (const chapterNumStr of Object.keys({
          ...formatFile,
          ...qualityFile,
        })) {
          const chapterNumber = Number(chapterNumStr);
          combined[chapterNumber] = {
            isFormatOk: !!formatFile[chapterNumber],
            isQualityOk: !!qualityFile[chapterNumber],
          };
        }

        setProgressData(combined); // ✅ gọi setState từ async function
      } catch (err) {
        console.error("⚠️ Không load được progress:", err);
      }
    };

    loadProgress();
  }, [bookSlug]);

  const pageSize = 10;
  const totalPages = Math.ceil(numberOfChapters / pageSize);

  useEffect(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    fetchChapters(bookSlug, start, end, setChapters);
  }, [bookSlug, page]);

  const handleUploaded = async () => {
    setShowUploadModal(false);
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    await fetchChapters(bookSlug, start, end, setChapters);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          📚 Danh sách chương ({numberOfChapters})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-red-600 rounded p-2 cursor-pointer hover:bg-red-800 transition-colors duration-200 shadow text-white"
          >
            <BrushCleaning className="w-6 h-6" />
          </button>
          <button
            onClick={() => downloadBooks(bookSlug)}
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
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {chapters.length === 0 ? (
        <p>Không có chương nào.</p>
      ) : (
        <ul className="divide-y divide-gray-200 gap-2">
          {chapters.map((chapter) => (
            <li
              key={chapter.chapterNumber}
              onClick={() => setSelectedChapter(chapter.chapterNumber)}
              className={`py-3 px-4 flex justify-between items-center rounded-lg hover:bg-gray-200  transition mb-1 bg-gray-50 ${
                progressData[chapter.chapterNumber]?.isFormatOk
                  ? "border border-emerald-400"
                  : ""
              }`}
            >
              {/* Thông tin chapter */}
              <div className="flex flex-col">
                <p className="font-semibold  flex items-center gap-2">
                  Chương {chapter.chapterNumber}:{" "}
                  <span className="font-normal text-gray-700">
                    {chapter.title}
                  </span>
                </p>
                <p className="text-sm text-gray-500 italic">
                  Cập nhật: {renderDate(chapter.createdAt)}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(`/book/${bookSlug}/chapter/${chapter.chapterNumber}`)
                }
                className=" text-white transition-all cursor-pointer"
              >
                <SquarePen className="w-6 h-6 text-zinc-700 hover:text-zinc-900" />
              </button>
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

          <span className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium shadow-sm">
            Trang {page} / {totalPages}
          </span>

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
        {showUploadModal && (
          <UploadChaptersModal
            bookSlug={bookSlug}
            onClose={() => setShowUploadModal(false)}
            onUploaded={handleUploaded}
          />
        )}

        {/* Popup Review Chapter */}
        {selectedChapter > 0 && (
          <ReviewChapterModal
            key={`${bookSlug}-${selectedChapter}`}
            bookSlug={bookSlug}
            chapterNumber={selectedChapter}
            initialProgress={
              progressData[selectedChapter] || {
                isFormatOk: false,
                isQualityOk: false,
              }
            }
            onClose={() => setSelectedChapter(-1)}
            onNavigate={(newNumber) => setSelectedChapter(newNumber)}
            onUpdateProgress={(chapterNum, progress) => {
              setProgressData((prev) => ({
                ...prev,
                [chapterNum]: progress,
              }));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
