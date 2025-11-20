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

export const fetchAndDecompress = async (url: string): Promise<string> => {
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Không tải được file từ ${url}`);

  // Lấy header content-type để kiểm tra gzip
  const contentType = res.headers.get("content-type") || "";

  // Nếu text/plain → đọc thẳng
  if (contentType.includes("text/plain")) {
    return await res.text();
  }

  // Nếu application/gzip hoặc octet-stream → fetch arrayBuffer + gunzip
  const buffer = await res.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // Kiểm tra magic bytes của gzip: 1F 8B
  if (uint8[0] === 0x1f && uint8[1] === 0x8b) {
    const decompressed = decompressSync(uint8);
    return strFromU8(decompressed);
  }

  // fallback: đọc như text
  return new TextDecoder().decode(uint8);
};