import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { compressText } from "../../utils/compress";
import { fetchChapterDetail } from "../../../apis/chapters";
import { useNavigate } from "react-router-dom";
import { getEndpoint } from "../../../apis";

interface ReviewChapterModalProps {
  bookSlug: string;
  chapterNumber: number;
  onClose: () => void;
  onNavigate?: (newChapterNumber: number) => void;
  initialProgress?: { isFormatOk: boolean; isQualityOk: boolean };
  onUpdateProgress?: (
    chapterNumber: number,
    progress: { isFormatOk: boolean; isQualityOk: boolean }
  ) => void;
}

export default function ReviewChapterModal({
  bookSlug,
  chapterNumber,
  onClose,
  onNavigate,
  initialProgress = { isFormatOk: false, isQualityOk: false },
}: ReviewChapterModalProps) {
  const [chapterContent, setChapterContent] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChapterDetail(bookSlug, chapterNumber, setChapterContent);
  }, [bookSlug, chapterNumber]);

  const handleSaveContent = async () => {
    if (!chapterContent) return;

    setIsSaving(true);

    try {
      const lines = chapterContent.split("\n");
      const metadataLine = lines[0] || "";

      // Lấy phần sau dấu ':' làm title
      const parsedTitle = metadataLine.includes(":")
        ? metadataLine.split(":")[1].trim()
        : metadataLine.trim();

      const metadata = {
        title: parsedTitle || `Chương ${chapterNumber}`,
        rawMeta: metadataLine,
        chapterNumber,
      };
      const formData = new FormData();
      const fileName = `chuong-${chapterNumber}.txt`;
      const compressed = compressText(chapterContent);
      const blob = new Blob([Uint8Array.from(compressed)], {
        type: "application/octet-stream",
      });

      // append vào array "files"
      formData.append("files", blob, fileName);
      formData.append("chapters", JSON.stringify([metadata]));

      // ---------------------------
      // 2. Upload
      // ---------------------------
      await axios.post(
        getEndpoint(`books/${bookSlug}/chapters/upload`),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("Lưu nội dung thành công!");
    } catch (err) {
      console.error(err);
      alert("Lưu nội dung thất bại!");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Format content ----------
  const handleFormatContent = () => {
    if (!chapterContent) return;

    // chuẩn hoá newline
    const normalized = chapterContent
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    const lines = normalized.split("\n");

    const outLines: string[] = [];
    let prevBlank = false;

    for (const rawLine of lines) {
      // collapse mọi khoảng trắng (space, tab, newline) thành một space trong line
      // sau đó trim đầu/cuối
      const line = rawLine.replace(/\s+/g, " ").trim();

      if (line === "") {
        // dòng trống
        if (!prevBlank) {
          outLines.push("");
          prevBlank = true;
        } // nếu đã có blank trước đó, bỏ qua để tránh nhiều blank liên tiếp
      } else {
        outLines.push(line);
        prevBlank = false;
      }
    }

    // trim đầu/cuối toàn bộ text (nếu muốn bỏ blank ở đầu/cuối)
    // nhưng giữ 1 blank giữa các đoạn
    return outLines.join("\n").trim();
  };

  const handlePrev = () => {
    if (chapterNumber > 1 && onNavigate) onNavigate(chapterNumber - 1);
  };

  const handleNext = () => {
    if (onNavigate) onNavigate(chapterNumber + 1);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([chapterContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chapter-${chapterNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        key={`${bookSlug}-${chapterNumber}-${initialProgress.isFormatOk}-${initialProgress.isQualityOk}`}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[95%] max-w-4xl p-6 relative max-h-[90vh] flex flex-col"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        {/* Sticky top: Điều hướng + checkbox + đóng */}
        <div className="sticky top-0 z-10 mb-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 rounded-lg shadow-sm px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrev}
              disabled={chapterNumber <= 1}
              className={`flex items-center px-4 py-2 rounded-xl border text-sm font-medium transition ${
                chapterNumber <= 1
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              ← <span className="ml-1">Chương trước</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center px-4 py-2 rounded-xl border text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span>Chương sau</span> →
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 cursor-pointer rounded-xl border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              ✖ Đóng
            </button>
          </div>
        </div>

        {/* Nội dung chapter */}
        <div className="flex-1 overflow-y-auto h-[400px] pt-4 flex flex-col">
          <textarea
            rows={20}
            value={chapterContent}
            onChange={(e) => setChapterContent(e.target.value)}
            className="flex-1 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none min-h-[250px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={handleSaveContent}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? "Đang lưu..." : "Lưu nội dung"}
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-4 py-2 rounded-xl border bg-green-500 text-white hover:bg-green-600 transition-all"
            >
              Download TXT
            </button>
            <button
              onClick={() =>
                navigate(`/book/${bookSlug}/chapter/${chapterNumber}`)
              }
              className="px-4 py-2 rounded-xl border bg-red-500 text-white transition-all cursor-pointer"
            >
              Tới trang edit
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
