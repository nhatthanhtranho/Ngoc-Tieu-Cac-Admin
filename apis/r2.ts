import axios from "axios";
import { BACKEND_URL } from "../src/constant";

export async function uploadToR2({
  key,
  file,
  contentType,
  isPublic,
}: {
  key: string;
  file: Blob;
  contentType: string;
  isPublic: boolean;
}) {
  // 1. get presigned url
  const { data } = await axios.post(`${BACKEND_URL}/r2/sign`, {
    key,
    contentType,
    isPublic,
  });

  // 2. direct upload to R2 (FASTEST PATH)
  const res = await fetch(data.url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!res.ok) throw new Error("Upload failed");
}