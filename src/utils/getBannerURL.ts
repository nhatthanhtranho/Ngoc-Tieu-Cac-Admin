const STORAGE = "https://ngoc-tieu-cac-public.s3.ap-southeast-1.amazonaws.com";

export function getBannerURL(storySlug: string): string {
  return `${STORAGE}/${storySlug}/banner.webp`;
}

export function getSmallBannerURL(storySlug: string): string {
  return `${STORAGE}/${storySlug}/banner-small.webp`;
}

export function getAvatarUrl(id: string): string {
  return `${STORAGE}/user-avatar/${id}.webp`;
}
