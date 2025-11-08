// Lấy endpoint từ biến môi trường, fallback về localhost nếu không có
const endpoint = import.meta.env.VITE_ENVIRONMENT === 'production' ? "https://d1spvvcw7w1abe.cloudfront.net" : "http://localhost:3002";

export function getEndpoint(path: string): string {
  return `${endpoint}/${path}`;
}
