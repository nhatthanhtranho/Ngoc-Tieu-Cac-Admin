import { getEndpoint } from ".";
import { compressText, decompressText } from "../src/utils/compress";
import axios from "axios";

export interface Chapter {
  chapterNumber: number;
  title: string;
  createdAt: string;
}

export async function setChapterQuality(
  bookSlug: string,
  chapterNumber: number
) {
  return axios.post(
    getEndpoint(`books/${bookSlug}/chapters/${chapterNumber}/quality`)
  );
}

export async function fetchChapters(
  bookSlug: string,
  start: number,
  end: number,
  setChapters: (chapters: Chapter[]) => void
) {
  if (!bookSlug) return;
  const res = await axios.get<{ data: Chapter[] }>(
    getEndpoint(`books/${bookSlug}/chapters?start=${start}&end=${end}`)
  );
  setChapters(res.data.data);
}

export async function fetchChapterDetail(
  bookSlug: string,
  chapterNumber: number,
  setContent: (content: string) => void,
  setQuality?: (isQualified: boolean) => void
) {
  const res = await axios.get(
    getEndpoint(`books/${bookSlug}/chapters/${chapterNumber}`)
  );
  const content = decompressText(res.data.content);
  setContent(content);
  if (setQuality) setQuality(res.data.chapterInfo.isQualified);
  return res.data;
}

export async function saveChaptercontent(
  bookSlug: string,
  chapterNumber: number,
  chapterContent: string
) {
  if (!chapterContent) return;

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
  await axios.post(getEndpoint(`books/${bookSlug}/chapters/upload`), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
