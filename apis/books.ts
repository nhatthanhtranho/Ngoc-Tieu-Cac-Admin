import axios from "axios";
import { getEndpoint } from ".";

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
