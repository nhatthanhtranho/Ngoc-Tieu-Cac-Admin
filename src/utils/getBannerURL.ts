const STORAGE = "https://s3.ap-southeast-1.amazonaws.com/assets.itruyenchu.com";

export function getBannerURL(storySlug: string, type?: string): string {
  if(type === "ngang") return `${STORAGE}/book-cover/${storySlug}/banner-ngang.webp`;
  if(type === "ngang-small") return `${STORAGE}/book-cover/${storySlug}/banner-ngang-small.webp`

  return `${STORAGE}/book-cover/${storySlug}/banner.webp`;
}

export function getSmallBannerURL(storySlug: string): string {
  return `${STORAGE}/book-cover/${storySlug}/banner-small.webp`;
}

export function getAvatarUrl(id: string): string {
  return `${STORAGE}/user-avatar/${id}.webp`;
}
