import { api } from ".";

export async function postComment(bookSlug: string) {}

export async function getCommentsInBook(bookSlug: string) {
  const res = await api.get(`/comments/${bookSlug}`);
  return res.data;
}
