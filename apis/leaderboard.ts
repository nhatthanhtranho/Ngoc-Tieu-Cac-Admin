import axios from "axios";
import { getEndpoint } from ".";

export async function getLeaderboard(
  type: string,
  setLeaderboardBooks: (bookSlugs: string[]) => void
) {
  const res = await axios.get(getEndpoint(`trendings/${type}`));
  setLeaderboardBooks(res.data.books);
  return res.data;
}

export async function setLeaderboard(type: string, bookSlugs: string[]) {
  return axios.post(getEndpoint(`trendings`), {
    type,
    books: bookSlugs,
  });
}
