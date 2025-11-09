import { useState } from "react";
import { downloadBooks } from "../../../apis/books";
import { X } from "lucide-react";

interface DownloadModalProps {
  bookSlug: string;
  onClose: () => void;
  totalChapters: number; // tổng số chương của sách
}

export default function DownloadBookModal({
  bookSlug,
  onClose,
  totalChapters,
}: DownloadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State cho range min và max
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(totalChapters);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      await downloadBooks(bookSlug, startChapter, endChapter);
    } catch (err: any) {
      setError(err.message || "Download thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 h-screen bg-black/30">
      <div className="bg-white rounded-2xl overflow-hidden shadow w-96 relative">
        <img src="/download-bg.png" className="w-full h-auto" />

        {/* Close button góc phải */}
        <div className="px-6 pb-4">
          <h3 className="text-xl font-semibold mb-2">Download Chapters</h3>

          {error && <p className="text-red-500 mb-2">{error}</p>}

          {/* Range chọn min → max */}
          <div className="mb-4">
            <label className="block mb-1">
              Chọn chương từ {startChapter} → {endChapter}
            </label>
            <div className="relative h-6">
              {/* Background track */}
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-300 rounded"></div>

              {/* Highlight giữa start → end */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-green-500 rounded"
                style={{
                  left: `${((startChapter - 1) / (totalChapters - 1)) * 100}%`,
                  right: `${
                    100 - ((endChapter - 1) / (totalChapters - 1)) * 100
                  }%`,
                }}
              ></div>

              {/* Input range start */}
              <input
                type="range"
                min={1}
                max={totalChapters}
                value={startChapter}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStartChapter(Math.min(val, endChapter));
                }}
                className="absolute w-full h-6 appearance-none bg-transparent pointer-events-auto"
                style={{ zIndex: 2 }}
              />

              {/* Input range end */}
              <input
                type="range"
                min={1}
                max={totalChapters}
                value={endChapter}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEndChapter(Math.max(val, startChapter));
                }}
                className="absolute w-full h-6 appearance-none bg-transparent pointer-events-auto"
                style={{ zIndex: 3 }}
              />
            </div>

            {/* Hiển thị số */}
            <div className="flex justify-between text-sm mt-1 text-gray-700">
              <span>{startChapter}</span>
              <span>{endChapter}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleDownload}
              className="hover:bg-[#2d3a76] text-white w-24 rounded bg-[#335495] cursor-pointer"
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Tải về"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border border-red-500 text-red-500 hover:bg-red-100 cursor-pointer transition"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
