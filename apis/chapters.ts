import axios from "axios";
import { api } from ".";

export interface Chapter {
  chapterNumber: number;
  title: string;
  createdAt?: string;
  isQualified?: boolean;
}




export async function fetchChapters(
  bookSlug: string,
  setChapters: (chapters: Chapter[]) => void,
) {
  if (!bookSlug) return;
  const res = await axios.get<Chapter[]>(
    `http://localhost:3001/chapters/${bookSlug}`
  );
  setChapters(res.data);
}

export async function createChapters(bookSlug: string, chapters: Chapter[]) {
  return axios.post(`http://localhost:3001/chapters/${bookSlug}`, chapters);
}

export async function getChapterUploadLink(
  bookSlug: string,
  isPublic = false
): Promise<{
  url: string;
  fields: Record<string, string>;
  preview: string;
  previewFields: Record<string, string>;
}> {
  const res = await api.get(
    `/chapters/${bookSlug}/upload?isPublic=${isPublic ? 1 : 0}`
  );
  return res.data;
}

export async function deleteAllChapters(
  bookSlug: string
): Promise<{ url: string; fields: Record<string, string> }> {
  const res = await api.delete(`/chapters/${bookSlug}`);
  return res.data;
}