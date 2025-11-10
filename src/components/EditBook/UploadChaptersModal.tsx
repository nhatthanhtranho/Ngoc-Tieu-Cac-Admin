import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { createChapters, getChapterUploadLink } from "../../../apis/chapters";
import { compressText } from "../../utils/compress";

export interface ParsedChapter {
  chapterNumber: number;
  title: string;
  fileName: string;
}

interface UploadChaptersModalProps {
  bookSlug: string;
  onClose: () => void;
  onUploaded: () => void;
}

const CHAPTER_BATCH_SIZE = 50; // create chapters per batch
const FILE_BATCH_SIZE = 100; // upload files per batch
const CONCURRENCY = 5; // parallel uploads

export default function UploadChaptersModal({
  bookSlug,
  onClose,
  onUploaded,
}: UploadChaptersModalProps) {
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // extract first line as chapter title
  const extractFirstLine = async (file: File) => {
    const text = await file.text();
    const firstLine = text.split("\n")[0].trim();
    return firstLine.replace(/^Chương\s*\d+\s*[:\-–]?\s*/i, "").trim();
  };

  const handleChooseFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".txt";
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      const files = Array.from(target.files).filter((f) =>
        f.name.endsWith(".txt")
      );
      if (files.length === 0) return;

      const parsed = await Promise.all(
        files.map(async (file) => {
          const match = file.name.match(/chuong-(\d+)/i);
          const chapterNumber = match ? Number(match[1]) : NaN;
          const title = await extractFirstLine(file);
          return { chapterNumber, title, fileName: file.name, file };
        })
      );

      setParsedChapters(
        parsed
          .filter((ch) => !isNaN(ch.chapterNumber))
          .sort((a, b) => a.chapterNumber - b.chapterNumber)
      );
    };
    input.click();
  };

  const uploadBatchWithConcurrency = async <T,>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>,
    onItemDone?: () => void
  ) => {
    const queue = items.slice();
    const runners: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      const run = (async () => {
        while (queue.length > 0) {
          const item = queue.shift()!;
          if (abortRef.current?.signal.aborted) throw new Error("aborted");
          await worker(item);
          onItemDone?.();
        }
      })();
      runners.push(run);
    }

    await Promise.all(runners);
  };

  const handleUpload = async () => {
    if (parsedChapters.length === 0) {
      alert("Chưa chọn file!");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    setCurrentBatch(0);
    abortRef.current = new AbortController();

    try {
      // 1️⃣ Batch create chapters
      for (let i = 0; i < parsedChapters.length; i += CHAPTER_BATCH_SIZE) {
        const batch = parsedChapters.slice(i, i + CHAPTER_BATCH_SIZE);
        await createChapters(
          bookSlug,
          batch.map((item) => ({
            chapterNumber: item.chapterNumber,
            title: item.title,
          }))
        );
      }

      // 2️⃣ Get upload URL
      const { url, fields } = await getChapterUploadLink(bookSlug);

      // 3️⃣ Pre-read and compress all files (đảm bảo NotReadableError không xảy ra)
      const filesToUpload = await Promise.all(
        parsedChapters.map(async (ch) => {
          const text = await (ch as any).file.text(); // file reference
          const compressed = compressText(text);
          const blob = new Blob([compressed as BlobPart], {
            type: "application/octet-stream",
          });
          const fileObj = new File([blob], ch.fileName, {
            type: "application/octet-stream",
          });
          return fileObj;
        })
      );

      const totalFiles = filesToUpload.length;
      let uploadedCount = 0;
      const onSingleDone = () => {
        uploadedCount++;
        setProgress((uploadedCount / totalFiles) * 100);
      };

      // 4️⃣ Upload in batches with concurrency
      for (
        let batchStart = 0;
        batchStart < totalFiles;
        batchStart += FILE_BATCH_SIZE
      ) {
        if (abortRef.current.signal.aborted) throw new Error("aborted");

        const batchFiles = filesToUpload.slice(
          batchStart,
          batchStart + FILE_BATCH_SIZE
        );
        setCurrentBatch(batchStart / FILE_BATCH_SIZE + 1);

        await uploadBatchWithConcurrency(
          batchFiles,
          CONCURRENCY,
          async (file) => {
            const formData = new FormData();
            Object.entries(fields).forEach(([k, v]) =>
              formData.append(k, v as string)
            );
            formData.set("key", `${bookSlug}/${file.name}`);
            if (!fields.acl) formData.append("acl", "private");
            formData.append("file", file);

            const res = await fetch(url, {
              method: "POST",
              body: formData,
              signal: abortRef.current?.signal,
            });
            if (!res.ok) {
              const text = await res.text().catch(() => "");
              throw new Error(
                `Upload failed for ${file.name}: ${res.status} ${text}`
              );
            }
            onSingleDone();
          }
        );
      }

      setProgress(100);
      setUploading(false);
      onUploaded();
      handleReset(); // ✅ clean state
    } catch (err: any) {
      if (err?.message === "aborted")
        setError("Upload đã bị hủy bởi người dùng.");
      else setError(err?.message ?? "Upload thất bại");
      setUploading(false);
    }
  };

  const handleCancel = () => abortRef.current?.abort();
  const handleReset = () => {
    setParsedChapters([]);
    setProgress(0);
    setCurrentBatch(0);
    setError(null);
    abortRef.current = null;
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

        {parsedChapters.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4">
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

            <div className="mt-3 flex gap-3">
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                ↩️ Chọn lại folder khác
              </button>
              <button
                onClick={handleChooseFolder}
                className="text-sm text-gray-600 underline"
              >
                Thêm file
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="px-4 mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {" "}
              {progress.toFixed(1)}% — batch {currentBatch}{" "}
            </p>
          </div>
        )}

        {error && <div className="px-4 text-sm text-red-600">{error}</div>}

        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md border">
            Hủy
          </button>
          {!uploading && (
            <button
              onClick={handleUpload}
              disabled={parsedChapters.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Tải lên (nén Brotli)
            </button>
          )}
          {uploading && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-md border"
            >
              Hủy upload
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
