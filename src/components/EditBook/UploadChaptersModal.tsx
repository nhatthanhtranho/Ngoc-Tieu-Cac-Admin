"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { compressText } from "@/utils/compress";

interface ParsedChapter {
  chapterNumber: number;
  title: string;
  fileName: string;
}

interface UploadChaptersModalProps {
  bookSlug: string;
  onClose: () => void;
  onUploaded: () => void;
}

export default function UploadChaptersModal({
  bookSlug,
  onClose,
  onUploaded,
}: UploadChaptersModalProps) {
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const extractFirstLine = async (file: File): Promise<string> => {
    const text = await file.text();
    const firstLine = text.split("\n")[0].trim();
    return firstLine.replace(/^Chương\s*\d+\s*[:\-–]?\s*/i, "").trim();
  };

  const handleChooseFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      const files = Array.from(target.files).filter((f) =>
        f.name.endsWith(".txt")
      );
      setRawFiles(files);

      const parsed = await Promise.all(
        files.map(async (file) => {
          const match = file.name.match(/chuong-(\d+)/i);
          const chapterNumber = match ? Number(match[1]) : NaN;
          const title = await extractFirstLine(file);
          return { chapterNumber, title, fileName: file.name };
        })
      );

      setParsedChapters(
        parsed
          .filter((ch) => !isNaN(ch.chapterNumber)) // loại bỏ file không parse được
          .sort((a, b) => a.chapterNumber - b.chapterNumber) // sort số thực sự
      );
    };
    input.click();
  };

  const handleUpload = async () => {
    if (rawFiles.length === 0) {
      alert("Chưa chọn file!");
      return;
    }

    const BATCH_SIZE = 100;
    const DELAY_MS = 1500;
    const totalBatches = Math.ceil(rawFiles.length / BATCH_SIZE);

    setUploading(true);
    setProgress(0);
    setCurrentBatch(0);

    try {
      let uploadedCount = 0;

      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batchFiles = rawFiles.slice(start, end);
        const batchChapters = parsedChapters.slice(start, end);

        const formData = new FormData();

        for (const file of batchFiles) {
          const text = await file.text();
          const compressed = await compressText(text);
          const blob = new Blob([Uint8Array.from(compressed)], {
            type: "application/br",
          });
          const compressedFile = new File(
            [blob],
            file.name.replace(".txt", ".br"),
            { type: "application/br" }
          );
          formData.append("files", compressedFile);
        }

        formData.append("chapters", JSON.stringify(batchChapters));
        setCurrentBatch(i + 1);

        await axios.post(
          `http://localhost:3002/books/${bookSlug}/chapters/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent =
                  ((uploadedCount +
                    (progressEvent.loaded / progressEvent.total) *
                      batchFiles.length) /
                    rawFiles.length) *
                  100;
                setProgress(percent);
              }
            },
          }
        );

        uploadedCount += batchFiles.length;
        setProgress((uploadedCount / rawFiles.length) * 100);

        if (i < totalBatches - 1) {
          await sleep(DELAY_MS);
        }
      }

      alert("✅ Upload tất cả chương (đã nén Brotli) thành công!");
      onUploaded();
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi upload");
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentBatch(0);
    }
  };

  const handleReset = () => {
    setParsedChapters([]);
    setRawFiles([]);
    setProgress(0);
    setCurrentBatch(0);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-[700px] max-h-[80vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            Upload chương truyện (Brotli)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Chọn folder */}
        {parsedChapters.length === 0 && (
          <div className="m-4 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 hover:border-green-400 transition">
            Chọn folder{" "}
            <button
              onClick={handleChooseFolder}
              className="text-green-600 underline"
            >
              từ máy
            </button>
          </div>
        )}

        {/* Preview 10 chương đầu */}
        {parsedChapters.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm border-collapse border-gray-200">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Chương</th>
                  <th className="px-3 py-2 text-left">Tiêu đề</th>
                  <th className="px-3 py-2 text-left">Tên file</th>
                </tr>
              </thead>
              <tbody>
                {parsedChapters.slice(0, 10).map((ch, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="p-3 border-y border-gray-100">
                      {ch.chapterNumber}
                    </td>
                    <td className="p-3 border-y border-gray-100">{ch.title}</td>
                    <td className="p-3 border-y border-gray-100 text-gray-500">
                      {ch.fileName}
                    </td>
                  </tr>
                ))}
                {parsedChapters.length > 10 && (
                  <tr className="text-center text-gray-500">
                    <td colSpan={3} className="p-3 italic">
                      ...và {parsedChapters.length - 10} chương nữa
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <button
              onClick={handleReset}
              className="mt-3 text-sm text-blue-600 underline hover:text-blue-800"
            >
              ↩️ Chọn lại folder khác
            </button>
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="px-4 mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {progress.toFixed(1)}% — batch {currentBatch} /{" "}
              {Math.ceil(rawFiles.length / 100)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md border">
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || parsedChapters.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? "Đang nén & tải..." : "Tải lên (nén Brotli)"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
