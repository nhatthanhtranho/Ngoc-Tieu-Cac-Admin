import { api } from ".";
import { compressText, decompressText } from "../src/utils/compress";

export interface Chapter {
  chapterNumber: number;
  title: string;
  createdAt?: string;
  isQualified?: boolean;
}

export async function setChapterQuality(
  bookSlug: string,
  chapterNumber: number,
  isQualified: boolean
) {
  return api.post(`/chapters/${bookSlug}/content/${chapterNumber}/quality`, {
    isQualified,
  });
}

export async function getChapterQuality(
  bookSlug: string,
  chapterNumber: number
) {
  const res = await api.get(
    `/chapters/${bookSlug}/content/${chapterNumber}/quality`
  );
  return res.data;
}

export async function fetchChapters(
  bookSlug: string,
  start: number,
  end: number,
  setChapters: (chapters: Chapter[]) => void,
  sort: "asc" | "desc" = "asc"
) {
  if (!bookSlug) return;
  const res = await api.get<Chapter[]>(
    `admin/chapters/${bookSlug}/titles?start=${start}&end=${end}&sort=${sort}`
  );
  setChapters(res.data);
}

export async function createChapters(bookSlug: string, chapters: Chapter[]) {
  return api.post(`/chapters/${bookSlug}`, chapters);
}

export async function fetchChapterDetail(
  bookSlug: string,
  chapterNumber: number
) {
  const res = await api.get(`chapters/${bookSlug}/content/${chapterNumber}`);
  return res.data;
}

export async function saveChapterContent(
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

  const chapter = {
    title: parsedTitle || `Chương ${chapterNumber}`,
    chapterNumber,
  };

  // Tạo chapter trên server
  await createChapters(bookSlug, [chapter]);

  // Lấy presigned URL upload
  const { url, fields } = await getChapterUploadLink(bookSlug);

  const formData = new FormData();
  const fileName = `chuong-${chapterNumber}.txt`;
  const compressed = compressText(chapterContent);

  // Blob từ Uint8Array
  const blob = new Blob([compressed as BlobPart], {
    type: "application/octet-stream",
  });

  // Nếu S3 presigned yêu cầu các fields, append tất cả
  Object.entries(fields || {}).forEach(([key, value]) => {
    formData.append(key, value as string);
  });

  // Thêm file cuối cùng
  formData.append("file", blob, fileName);

  await fetch(url, {
    method: "POST",
    body: formData,
  });
}

export async function getChapterUploadLink(
  bookSlug: string,
  isPublic = false,
  isAudio = false
): Promise<{ url: string; fields: Record<string, string> }> {
  const res = await api.get(
    `/chapters/${bookSlug}/upload?isPublic=${isPublic ? 1 : 0}&isAudio=${isAudio ? 1 : 0}`
  );
  return res.data;
}

export async function deleteAllChapters(
  bookSlug: string
): Promise<{ url: string; fields: Record<string, string> }> {
  const res = await api.delete(`/chapters/${bookSlug}`);
  return res.data;
}
