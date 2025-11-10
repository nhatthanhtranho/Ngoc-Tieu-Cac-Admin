const endpoint =
  import.meta.env.VITE_DEBUG === "true"
    ? "http://localhost:3002"
    : "https://d1spvvcw7w1abe.cloudfront.net";

export function getEndpoint(path: string): string {
  return `${endpoint}/${path}`;
}
