import axios from "axios";

export async function getLeaderboard(
  type: string,
  setLeaderboardBooks: (bookSlugs: string[]) => void
) {
  const res = await axios.get(`http://localhost:3002/trendings/${type}`);
  setLeaderboardBooks(res.data.books);
  return res.data;
}

export async function setLeaderboard(type: string, bookSlugs: string[]) {
  return axios.post(`http://localhost:3002/trendings`, {
    type,
    books: bookSlugs,
  });
}
