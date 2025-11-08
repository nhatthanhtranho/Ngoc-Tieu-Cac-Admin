const endpoint =
  "https://d1spvvcw7w1abe.cloudfront.net";

export function getEndpoint(path: string): string {
  return `${endpoint}/${path}`;
}
