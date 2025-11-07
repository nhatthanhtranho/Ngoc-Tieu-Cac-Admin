import { strToU8, compressSync, strFromU8, decompressSync } from "fflate";

export interface JsonBuffer {
  type: "Buffer";
  data: number[];
}

export const compressText = (text: string): Uint8Array => {
  const input = strToU8(text);
  return compressSync(input, { level: 9 });
};

export const decompressText = (compressed: JsonBuffer): string => {
  const input = new Uint8Array(compressed.data); // chuyển JSON Buffer → Uint8Array
  const decompressed = decompressSync(input);
  return strFromU8(decompressed);
};