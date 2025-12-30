import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { getEndpoint, api } from ".";
import { PUBLIC_BUCKET, uploadDataToS3 } from "./s3";
import { decompressText, JsonBuffer } from "../src/utils/compress";

export interface Book {
  currentAudioChapter?: number;
  isHidden?: boolean;
  isSeed?: boolean;
  _id?: string;
  title: string;
  description: string;
  dichGia: string;
  bannerURL?: string;
  bannerNgangURL?: string;
  currentChapter: number;
  slug: string;
  bannerImage?: { default: string; small: string; medium: string };
  tags?: string[];
  categories?: string[];
  tacGia: string;
  loves: number;
  price: number;
  totalViews: number;
  isPublished: boolean;
  beginBlockChapter: number;
  hasEbook: boolean;
  currentEbookChapter: number;
}

export async function createBook(newBook: Book): Promise<Book> {
  const res = await api.post<Book>("/books", { ...newBook });
  return res.data;
}

export async function toggleHiddenBook(bookSlug: string, seed: boolean) {
  const res = await api.get(`/admin/comments/${bookSlug}?seed=${seed}`);
  return res.data;
}

export async function fetchBookBySlug(
  slug: string,
  setBook: (book: Book) => void,
  setOriginalBook?: (book: Book) => void
): Promise<Book> {
  const res = await axios.get<Book>(getEndpoint(`books/${slug}`));
  setBook(res.data);
  setOriginalBook?.(res.data);
  return res.data;
}

export async function fetchAllBookSlugs(
  setBookSlugs: (
    bookSlugs: Array<{
      slug: string;
      title: string;
      categories: string[];
      currentAudioChapter: string | null;
    }>
  ) => void,
  isAll: boolean = true
): Promise<Array<{ slug: string; title: string }>> {
  const query = isAll ? `?status=true` : "";

  const res = await axios.get<
    Array<{
      slug: string;
      title: string;
      categories: string[];
      currentAudioChapter: string | null;
    }>
  >(getEndpoint(`books/slugs${query}`));

  setBookSlugs(res.data);
  return res.data;
}

export async function fetchBookBySlugs(
  slugs: string[],
  setBooks: (categories: Book[]) => void
) {
  const res = await axios.post<Book[]>(getEndpoint("books/slugs"), {
    slugs,
  });
  setBooks(res.data);
}

export async function downloadBooks(
  bookSlug: string,
  start: number,
  end: number
) {
  const res = await api.get<Array<{ name: string; url: string }>>(
    `/chapters/${bookSlug}/download?start=${start}&end=${end}`
  );
  const downloadLinks = res.data;
  const zip = new JSZip();

  for (const file of downloadLinks) {
    const res = await fetch(file.url);
    const arrayBuffer = await res.arrayBuffer(); // ArrayBuffer
    const jsonBuffer: JsonBuffer = {
      type: "Buffer",
      data: Array.from(new Uint8Array(arrayBuffer)),
    };
    const text = decompressText(jsonBuffer);

    // 4. Thêm vào ZIP
    zip.file(file.name, text);
  }

  // 5. Tạo Blob ZIP và trigger download
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${bookSlug}.zip`);
}

export async function checkBookSlugValid(bookSlug: string): Promise<boolean> {
  const res = await axios.get(getEndpoint(`books/check-slug/${bookSlug}`));
  return res.data.isValid;
}

export async function getUploadBookBannerUrl(bookSlug: string) {
  const response = await api.get(`/books/banner/upload/${bookSlug}`);
  return response.data;
}

export async function getUploadBookBannerNgangUrl(bookSlug: string) {
  const response = await api.get(`/admin/banner-ngang/upload/${bookSlug}`);
  return response.data;
}

export async function updateBook(
  bookSlug: string,
  changedData: Partial<Book>,
  book: Book
) {
  const res = await api.patch(`/books/${bookSlug}`, { ...changedData });
  await uploadDataToS3(
    PUBLIC_BUCKET,
    `books/${bookSlug}.json`,
    JSON.stringify(book)
  );
  return res.data;
}

export async function syncBookData(bookSlug: string) {
  return api.get(`/admin/books/${bookSlug}/sync`);
}
