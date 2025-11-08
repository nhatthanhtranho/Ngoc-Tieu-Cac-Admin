// helper generate banner URL
export function getBannerURL(storySlug: string): string {
  const BASE_URL =
    "https://ngoc-tieu-cac-public.s3.ap-southeast-1.amazonaws.com";
  return `${BASE_URL}/${storySlug}/banner.webp`;
}

type BannerSize = "default" | "small";

export function getSmallBannerURL(storySlug: string): string {
  const BASE_URL =
    "https://ngoc-tieu-cac-public.s3.ap-southeast-1.amazonaws.com";
  return `${BASE_URL}/${storySlug}/banner-small.webp`;
}
