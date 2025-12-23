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
  parentId: string,
  isRandomUser: boolean,
) {
  const res = await api.post(`/admin/create-comment`, {
    bookSlug,
    username,
    avatarUrl,
    content,
    parentId,
    random: isRandomUser
  });
  return res.data;
}

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
