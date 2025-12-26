import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { createChapters, getChapterUploadLink } from "../../../apis/chapters";
import { useNavigate } from "react-router-dom";

export interface ParsedChapter {
  chapterNumber: number;
  title: string;
  fileName: string;
  file: File;
}

interface UploadChaptersModalProps {
  bookSlug: string;
  onClose: () => void;
  onUploaded: () => void;
}

const CHAPTER_BATCH_SIZE = 100;
const CONCURRENCY = 5;

export default function UploadAudioModel({
  bookSlug,
  onClose,
  onUploaded,
}: UploadChaptersModalProps) {
  const navigate = useNavigate();
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // =========================
  // Select OPUS files
  // =========================
  const handleChooseFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".opus";

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      const files = Array.from(target.files).filter((f) =>
        f.name.toLowerCase().endsWith(".opus")
      );

      const parsed: ParsedChapter[] = files
        .map((file) => {
          const match = file.name.match(/chuong-(\d+)\.opus$/i);
          const chapterNumber = match ? Number(match[1]) : NaN;

          return {
            chapterNumber,
            title: "",
            fileName: file.name,
            file,
          };
        })
        .filter((ch) => !isNaN(ch.chapterNumber))
        .sort((a, b) => a.chapterNumber - b.chapterNumber);

      setParsedChapters(parsed);
    };

    input.click();
  };

  // =========================
  // Upload with concurrency
  // =========================
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
          if (abortRef.current?.signal.aborted) {
            throw new Error("aborted");
          }
          const item = queue.shift()!;
          await worker(item);
          onItemDone?.();
        }
      })();
      runners.push(run);
    }

    await Promise.all(runners);
  };

  // =========================
  // Upload logic
  // =========================
  const handleUpload = async () => {
    if (parsedChapters.length === 0) {
      alert("Chưa chọn file .opus");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    abortRef.current = new AbortController();

    try {
      // 1️⃣ Create chapters
      for (let i = 0; i < parsedChapters.length; i += CHAPTER_BATCH_SIZE) {
        const batch = parsedChapters.slice(i, i + CHAPTER_BATCH_SIZE);
        await createChapters(
          bookSlug,
          batch.map((ch) => ({
            chapterNumber: ch.chapterNumber,
            title: ch.title,
          }))
        );
      }

      // 2️⃣ Free / VIP split
      const freeChapters = parsedChapters.filter(
        (ch) => ch.chapterNumber <= 50
      );
      const vipChapters = parsedChapters.filter(
        (ch) => ch.chapterNumber > 50
      );

      const totalFiles = parsedChapters.length;
      let uploadedCount = 0;

      const onSingleDone = () => {
        uploadedCount++;
        setProgress((uploadedCount / totalFiles) * 100);
      };

      // 3️⃣ Upload FREE
      if (freeChapters.length > 0) {
        const { url, fields } = await getChapterUploadLink(bookSlug, true, true);

        await uploadBatchWithConcurrency(
          freeChapters,
          CONCURRENCY,
          async (ch) => {
            const formData = new FormData();
            Object.entries(fields).forEach(([k, v]) =>
              formData.append(k, v as string)
            );

            formData.set("key", `free/${bookSlug}/${ch.fileName}`);
            // formData.append("Content-Type", "audio/opus");
            formData.append("file", ch.file);

            const res = await fetch(url, {
              method: "POST",
              body: formData,
              signal: abortRef.current?.signal,
            });

            if (!res.ok) {
              throw new Error(`Upload free failed: ${ch.fileName}`);
            }
          },
          onSingleDone
        );
      }

      // 4️⃣ Upload VIP
      if (vipChapters.length > 0) {
        const { url, fields } = await getChapterUploadLink(bookSlug, false, true);

        await uploadBatchWithConcurrency(
          vipChapters,
          CONCURRENCY,
          async (ch) => {
            const formData = new FormData();
            Object.entries(fields).forEach(([k, v]) =>
              formData.append(k, v as string)
            );

            formData.set("key", `${bookSlug}/${ch.fileName}`);
            if (!fields.acl) formData.append("acl", "private");

            // formData.append("Content-Type", "audio/opus");
            formData.append("file", ch.file);

            const res = await fetch(url, {
              method: "POST",
              body: formData,
              signal: abortRef.current?.signal,
            });

            if (!res.ok) {
              throw new Error(`Upload vip failed: ${ch.fileName}`);
            }
          },
          onSingleDone
        );
      }

      setProgress(100);
      setUploading(false);
      onUploaded();
      handleReset();
    } catch (err: any) {
      if (err?.message === "aborted") {
        setError("Upload đã bị hủy.");
      } else {
        setError(err?.message ?? "Upload thất bại");
      }
      setUploading(false);
    }
  };

  const handleCancel = () => abortRef.current?.abort();

  const handleReset = () => {
    setParsedChapters([]);
    setProgress(0);
    setError(null);
    abortRef.current = null;
    navigate(0);
  };

  // =========================
  // UI
  // =========================
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
          <h3 className="font-semibold">Upload audio OPUS</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {parsedChapters.length === 0 && (
          <div className="m-4 border-2 border-dashed rounded-xl p-6 text-center">
            Chọn file{" "}
            <button
              onClick={handleChooseFolder}
              className="text-green-600 underline"
            >
              .opus
            </button>
          </div>
        )}

        {parsedChapters.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Chương</th>
                  <th>Tên file</th>
                </tr>
              </thead>
              <tbody>
                {parsedChapters.slice(0, 10).map((ch) => (
                  <tr key={ch.chapterNumber}>
                    <td>{ch.chapterNumber}</td>
                    <td>{ch.fileName}</td>
                  </tr>
                ))}
                {parsedChapters.length > 10 && (
                  <tr>
                    <td colSpan={2}>
                      ...và {parsedChapters.length - 10} chương nữa
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {uploading && (
          <div className="px-4 mb-2">
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-right">{progress.toFixed(1)}%</p>
          </div>
        )}

        {error && <div className="px-4 text-red-600">{error}</div>}

        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose}>Hủy</button>
          {!uploading && (
            <button
              onClick={handleUpload}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Tải lên
            </button>
          )}
          {uploading && (
            <button onClick={handleCancel}>Hủy upload</button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
