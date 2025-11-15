import { api } from ".";

export async function getLeaderboard(
  type: string,
  setLeaderboardBooks: (bookSlugs: string[]) => void
) {
  const res = await api.get(`/trendings/${type}`);
  setLeaderboardBooks(res.data.books);
  return res.data;
}

export async function setLeaderboard(type: string, bookSlugs: string[]) {
  return api.post(`/trendings`, {
    books: bookSlugs,
    type,
  });
}
