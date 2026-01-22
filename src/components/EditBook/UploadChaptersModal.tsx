import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  createChapters,
  getChapterUploadLink,
} from "../../../apis/chapters";
import { compressText } from "../../utils/compress";
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
const MAX_WORDS = 700;
const PREVIEW_LIMIT = 10;

/* ================= helpers ================= */

function takeFirstWordsKeepLines(text: string, maxWords = MAX_WORDS) {
  const lines = text.split(/\r?\n/);
  let count = 0;
  const result: string[] = [];

  for (const line of lines) {
    const words = line.trim().split(/\s+/).filter(Boolean);

    if (count + words.length <= maxWords) {
      result.push(line);
      count += words.length;
    } else {
      const remain = maxWords - count;
      if (remain > 0) {
        result.push(words.slice(0, remain).join(" "));
      }
      break;
    }
  }

  return result.join("\n");
}

const buildVipPreviewContent = (text: string) => `
${takeFirstWordsKeepLines(text, 700)}

────────────────────
🔒 Nội dung đầy đủ chỉ dành cho thành viên VIP
Vui lòng nâng cấp tài khoản để đọc trọn vẹn chương này.
────────────────────
`.trim();

/* ================= component ================= */

export default function UploadChaptersModal({
  bookSlug,
  onClose,
  onUploaded,
}: UploadChaptersModalProps) {
  const navigate = useNavigate();

  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalUploads, setTotalUploads] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const extractTitle = async (file: File, chapterNumber: number) => {
    const text = await file.text();
    const firstLine = text.split("\n")[0].trim();
    const match = firstLine.match(/^Chương\s*\d+\s*[:\-–]?\s*(.*)$/i);
    return match?.[1]?.trim() || `Chương ${chapterNumber}`;
  };

  /* ================= chọn folder ================= */

  const handleChooseFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".txt";

    input.onchange = async (e: Event) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const parsed = await Promise.all(
        files
          .filter((f) => f.name.endsWith(".txt"))
          .map(async (file) => {
            const match = file.name.match(/chuong-(\d+)/i);
            const chapterNumber = match ? Number(match[1]) : NaN;
            const title = await extractTitle(file, chapterNumber);
            return { chapterNumber, title, fileName: file.name, file };
          })
      );

      setParsedChapters(
        parsed
          .filter((c) => !isNaN(c.chapterNumber))
          .sort((a, b) => a.chapterNumber - b.chapterNumber)
      );
    };

    input.click();
  };

  /* ================= upload helpers ================= */

  const uploadWithConcurrency = async <T,>(
    items: T[],
    worker: (item: T) => Promise<void>
  ) => {
    const queue = [...items];
    const runners = Array.from({ length: CONCURRENCY }).map(async () => {
      while (queue.length) {
        if (abortRef.current?.signal.aborted) throw new Error("aborted");
        const item = queue.shift()!;
        await worker(item);
        setProgress((p) => p + 1);
      }
    });
    await Promise.all(runners);
  };

  /* ================= upload ================= */

  const handleUpload = async () => {
    if (!parsedChapters.length) return alert("Chưa chọn file");

    setUploading(true);
    setProgress(0);
    setError(null);
    abortRef.current = new AbortController();

    try {
      /* 1️⃣ create chapters */
      for (let i = 0; i < parsedChapters.length; i += CHAPTER_BATCH_SIZE) {
        const batch = parsedChapters.slice(i, i + CHAPTER_BATCH_SIZE);
        await createChapters(
          bookSlug,
          batch.map((c) => ({
            chapterNumber: c.chapterNumber,
            title: c.title,
          }))
        );
      }

      const freeChapters = parsedChapters.filter((c) => c.chapterNumber <= 50);
      const vipChapters = parsedChapters.filter((c) => c.chapterNumber > 50);

      const total = freeChapters.length + vipChapters.length * 2;
      setTotalUploads(total);
      setProgress(0);

      /* 2️⃣ upload FREE */
      if (freeChapters.length) {
        const { url, fields, preview } = await getChapterUploadLink(bookSlug, true);

        await uploadWithConcurrency(freeChapters, async (ch) => {
          const text = await ch.file.text();
          const file = new File([compressText(text)], ch.fileName, {
            type: "application/octet-stream",
          });

          const fd = new FormData();
          Object.entries(fields).forEach(([k, v]) => fd.append(k, v as string));
          fd.set("key", `free/${bookSlug}/${file.name}`);
          fd.append("file", file);

          const res = await fetch(url, { method: "POST", body: fd });
          if (!res.ok) throw new Error(`Upload free failed: ${file.name}`);
        });
      }

      /* 3️⃣ upload VIP preview */
      if (vipChapters.length) {
        await uploadWithConcurrency(vipChapters, async (ch) => {
          const { preview, fields } = await getChapterUploadLink(bookSlug);

          await uploadWithConcurrency(vipChapters, async (ch) => {
            const text = await ch.file.text();
            const file = new File([compressText(text)], ch.fileName, {
              type: "application/octet-stream",
            });

            const fd = new FormData();
            Object.entries(fields).forEach(([k, v]) => fd.append(k, v as string));
            fd.set("key", `${bookSlug}/${file.name}`);
            if (!fields.acl) fd.append("acl", "private");
            fd.append("file", file);

            const res = await fetch(preview, { method: "POST", body: fd });
            if (!res.ok) throw new Error("Upload vip full failed");
          });
        })
      }

      /* 4️⃣ upload VIP full */
      if (vipChapters.length) {
          const { url, fields } = await getChapterUploadLink(bookSlug);

          await uploadWithConcurrency(vipChapters, async (ch) => {
            const text = await ch.file.text();
            const file = new File([compressText(text)], ch.fileName, {
              type: "application/octet-stream",
            });

            const fd = new FormData();
            Object.entries(fields).forEach(([k, v]) => fd.append(k, v as string));
            fd.set("key", `${bookSlug}/${file.name}`);
            if (!fields.acl) fd.append("acl", "private");
            fd.append("file", file);

            const res = await fetch(url, { method: "POST", body: fd });
            if (!res.ok) throw new Error("Upload vip full failed");
          });
        }

        onUploaded();
        navigate(0);
      } catch (e: any) {
        setError(e.message || "Upload thất bại");
      } finally {
        setUploading(false);
      }
    };

    /* ================= UI ================= */

    const freeCount = parsedChapters.filter((c) => c.chapterNumber <= 50).length;
    const vipCount = parsedChapters.filter((c) => c.chapterNumber > 50).length;

    const previewChapters = parsedChapters.slice(0, PREVIEW_LIMIT);
    const hasMore = parsedChapters.length > PREVIEW_LIMIT;

    return (
      <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div className="bg-white rounded-2xl w-[800px] max-h-[80vh] flex flex-col">
          <div className="p-4 flex justify-between border-b">
            <h3 className="font-semibold">Upload chương</h3>
            <button onClick={onClose}>✕</button>
          </div>

          {parsedChapters.length === 0 && (
            <div className="m-6 border-2 border-dashed p-8 text-center">
              Chọn folder{" "}
              <button
                onClick={handleChooseFolder}
                className="underline text-green-600"
              >
                từ máy
              </button>
            </div>
          )}

          {parsedChapters.length > 0 && !uploading && (
            <div className="flex flex-col flex-1">
              <div className="px-4 py-2 text-sm text-gray-600 flex justify-between">
                <span>
                  Tổng: <b>{parsedChapters.length}</b> chương
                </span>
                <span>
                  Free: <b className="text-green-600">{freeCount}</b> | VIP:{" "}
                  <b className="text-purple-600">{vipCount}</b>
                </span>
              </div>

              <div className="overflow-auto border-t">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100">
                    <tr>
                      <th className="p-2 w-16 text-left">#</th>
                      <th className="p-2 text-left">Tiêu đề</th>
                      <th className="p-2 text-left">File</th>
                      <th className="p-2 w-20">Loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewChapters.map((c) => (
                      <tr key={c.fileName} className="border-t hover:bg-gray-50">
                        <td className="p-2 font-mono">{c.chapterNumber}</td>
                        <td className="p-2">{c.title}</td>
                        <td className="p-2 text-gray-500">{c.fileName}</td>
                        <td className="p-2 text-center">
                          {c.chapterNumber <= 50 ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            <span className="text-purple-600">VIP</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {hasMore && (
                    <tfoot>
                      <tr>
                        <td
                          colSpan={4}
                          className="p-3 text-center text-sm text-gray-500 bg-gray-50"
                        >
                          … còn <b>{parsedChapters.length - PREVIEW_LIMIT}</b>{" "}
                          chương nữa{" "}
                          <span className="ml-2 text-gray-400">
                            (chỉ hiển thị 10 chương đầu)
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {uploading && totalUploads > 0 && (
            <div className="px-4 py-4">
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-green-600 rounded"
                  style={{
                    width: `${Math.min((progress / totalUploads) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-600 text-right">
                {progress} / {totalUploads} file
              </div>
            </div>
          )}

          {error && <div className="p-4 text-red-600">{error}</div>}

          <div className="p-4 border-t flex justify-end gap-3">
            <button onClick={onClose}>Hủy</button>
            <button
              onClick={handleUpload}
              disabled={uploading || !parsedChapters.length}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              Tải lên
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
