export const formatImageLink = (url: string) => {
  return import.meta.env.VITE_ENV === "prd"
    ? `Ngoc-Tieu-Cac-Admin/${url}`
    : url;
};
