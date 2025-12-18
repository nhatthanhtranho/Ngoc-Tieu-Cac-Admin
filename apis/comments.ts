import { api } from ".";

export async function getCommentsInBook(bookSlug: string) {
  const res = await api.get(`/comments/${bookSlug}`);
  return res.data.comments;
}

export async function seedComment(
  bookSlug: string,
  username: string,
  avatarUrl: string,
  content: string,
  parentId: string
) {
  const res = await api.post(`/admin/create-comment`, {
    bookSlug,
    username,
    avatarUrl,
    content,
    parentId,
  });
  return res.data;
}

export async function getSeedUsers() {
  const res = await api.get(`/admin/get-seed-users`);
  return res.data;
}