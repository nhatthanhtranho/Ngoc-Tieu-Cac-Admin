export const formatImageLink = (url: string) => {
  return import.meta.env.VITE_ENV === "dev"
    ? url
    : `/Ngoc-Tieu-Cac-Admin/${url}`;
};
