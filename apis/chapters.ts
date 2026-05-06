import axios from "axios";
import { api } from ".";
import { BACKEND_URL } from "../src/constant";

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
    `${BACKEND_URL}/chapters/${bookSlug}`
  );
  setChapters(res.data);
}

export async function createChapters(bookSlug: string, chapters: Chapter[]) {
  return axios.post(`${BACKEND_URL}/chapters/${bookSlug}`, chapters);
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
  const res = await axios.get(
    `${BACKEND_URL}/chapters/download-link/${bookSlug}?isPublic=${isPublic ? 1 : 0}`
  );
  return res.data;
}

export async function deleteAllChapters(
  bookSlug: string
): Promise<{ url: string; fields: Record<string, string> }> {
  const res = await axios.delete(`${BACKEND_URL}/chapters/${bookSlug}`);
  return res.data;
}