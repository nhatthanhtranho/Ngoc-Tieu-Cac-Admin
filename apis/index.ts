const endpoint = "https://dhstn97hlf.execute-api.ap-southeast-1.amazonaws.com";

export function getEndpoint(path: string): string {
  return `${endpoint}/${path}`;
}
