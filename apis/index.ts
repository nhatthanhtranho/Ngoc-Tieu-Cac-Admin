const endpoint =
  "http://ec2-13-214-205-54.ap-southeast-1.compute.amazonaws.com";

export function getEndpoint(path: string): string {
  return `${endpoint}/${path}`;
}
