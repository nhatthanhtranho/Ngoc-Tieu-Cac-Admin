import axios from "axios";
import { api } from ".";
import { BACKEND_URL } from "../src/constant";

export async function getLeaderboard(
  type: string,
  setLeaderboardBooks: (bookSlugs: string[]) => void
) {
  const res = await axios.get(`${BACKEND_URL}/trendings/${type}`);
  setLeaderboardBooks(res.data.books);
  return res.data;
}

export async function setLeaderboard(type: string, bookSlugs: string[]) {
  return api.post(`/trendings`, {
    books: bookSlugs,
    type,
  });
}

export async function generateHomePageData() {
  return axios.get(`${BACKEND_URL}/books/generate`);
}
