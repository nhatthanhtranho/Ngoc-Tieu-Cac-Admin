import axios from "axios";

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
    `http://localhost:3002/books/slug/${slug}`
  );
  setBooks(res.data.data);
  return res.data.data;
}

export async function fetchAllBookSlugs(
  setBookSlugs: (bookSlugs: Array<{ slug: string; title: string }>) => void
): Promise<Array<{ slug: string; title: string }>> {
  const res = await axios.get<Array<{ slug: string; title: string }>>(
    `http://localhost:3002/books/slugs`
  );
  setBookSlugs(res.data);
  return res.data;
}

export async function fetchBookBySlugs(
  slugs: string[],
  setBooks: (categories: Book[]) => void
) {
  const res = await axios.post<Book[]>(`http://localhost:3002/books/slugs`, {
    slugs,
  });
  setBooks(res.data);
}
