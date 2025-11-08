import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { getEndpoint } from ".";
import { decompressText, JsonBuffer } from "../src/utils/compress";
import Epub from "epub-gen"; // hoặc import theo cách Node.js nếu dùng CommonJS

export interface Book {
  _id?: string;
  title: string;
  description: string;
  dichGia: string;
  bannerURL?: string;
  currentChapter: number;
  slug: string;
  bannerImage?: { default: string; small: string; medium: string };
  tags?: string[];
  categories?: string[];
  tacGia: string;
}

export async function fetchBookBySlug(
  slug: string,
  setBooks: (book: Book) => void
): Promise<Book> {
  const res = await axios.get<{ data: Book }>(
    getEndpoint(`books/slug/${slug}`)
  );
  setBooks(res.data.data);
  return res.data.data;
}

export async function fetchAllBookSlugs(
  setBookSlugs: (bookSlugs: Array<{ slug: string; title: string }>) => void
): Promise<Array<{ slug: string; title: string }>> {
  const res = await axios.get<Array<{ slug: string; title: string }>>(
    getEndpoint("books/slugs")
  );
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

export async function downloadBooks(bookSlug: string) {
  const res = await axios.get<Array<{ name: string; url: string }>>(
    getEndpoint(`books/${bookSlug}/chapters/download`)
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

export async function downloadBooksAsEpub(bookSlug: string, bookTitle: string) {
  // 1. Lấy danh sách chương
  const res = await axios.get<Array<{ name: string; url: string }>>(
    getEndpoint(`books/${bookSlug}/chapters/download`)
  );
  const downloadLinks = res.data;

  // 2. Chuyển chương thành object cho EPUB
  const epubChapters: { title: string; data: string }[] = [];

  for (const file of downloadLinks) {
    const res = await fetch(file.url);
    const arrayBuffer = await res.arrayBuffer();

    const jsonBuffer: JsonBuffer = {
      type: "Buffer",
      data: Array.from(new Uint8Array(arrayBuffer)),
    };

    const text = decompressText(jsonBuffer);

    epubChapters.push({
      title: file.name, // tên chương làm tiêu đề
      data: text.replace(/\n/g, "<br/>"), // EPUB cần HTML, chuyển newline → <br/>
    });
  }

  // 3. Tạo EPUB
  const option = {
    title: bookTitle,
    author: "Unknown", // bạn có thể lấy từ metadata
    content: epubChapters,
  };

  // epub-gen trong Node.js trả về Promise<string> là path file trên server
  // Ở frontend bạn cần tạo Blob EPUB
  const epub = await new Epub(option).promise; // nếu frontend: phải dùng NodeJS / server side

  // Nếu muốn download trên frontend, bạn cần có Blob
  const epubBlob = new Blob([epub], { type: "application/epub+zip" });
  saveAs(epubBlob, `${bookSlug}.epub`);
}
