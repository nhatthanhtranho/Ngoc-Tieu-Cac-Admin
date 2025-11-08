const endpoint =
  // "https://d1spvvcw7w1abe.cloudfront.net";
  "http://localhost:3002";

export function getEndpoint(path: string): string {
  return `${endpoint}/${path}`;
}
