import axios from "axios";
import { api } from ".";
import { BACKEND_URL } from "../src/constant";

export async function getCommentsInBook(bookSlug: string) {
  const res = await axios.get(`${BACKEND_URL}/comments/${bookSlug}`);
  return res.data.comments;
}

export async function seedComment(
  bookSlug: string,
  username: string,
  content: string,
  parentId: string,
  random: boolean,
  isConverter = false,
  isRandomDate=false,
) {
  const res = await api.post(`/admin/create-comment`, {
    bookSlug,
    username,
    content,
    parentId,
    random: random,
    converter: isConverter,
    randomCreatedDate: isRandomDate
  });
  return res.data;
}

// HERE

export async function getSeedUsers() {
  const res = await api.get(`/admin/get-seed-users`);
  return res.data;
}

/* --------------------------- Toggle seed comment --------------------------- */
export async function toggleSeedComment(
  bookSlug: string,
  seed: boolean
) {
  const res = await api.get(
    `/admin/comments/${bookSlug}?seed=${seed}`
  );
  return res.data;
}
