import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { BACKEND_URL } from "../src/constant";
import axios from "axios";

// ============================
// CONFIG
// ============================

const S3_REGION = "ap-southeast-1";
export const PUBLIC_BUCKET = "assets.itruyenchu.com";
export const PRIVATE_BUCKET = "ngoc-tieu-cac";
const STORAGE_KEY = "s3_credentials";

// ============================
// CREDENTIAL MANAGER
// ============================

async function getValidS3Credentials() {
  // 1. Lấy từ localStorage
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw) {
    const creds = JSON.parse(raw);
    const expired = Date.now() > new Date(creds.expiration).getTime();

    if (!expired) {
      return creds;
    }
  }

  // 2. Hết hạn → gọi API lấy token mới
  const res = await axios.get(`${BACKEND_URL}/admin/token`);
  const newCreds = res;

  // 3. Lưu vào localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newCreds));

  return newCreds;
}


export async function uploadAvatarToS3(
  username: string,
  file: File
) {
  const creds = await getValidS3Credentials();

  const s3 = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken,
    },
  });

  const key = `avatars/${username}.webp`;

  const arrayBuffer = await file.arrayBuffer(); // 👈 convert trước

  const command = new PutObjectCommand({
    Bucket: PUBLIC_BUCKET,
    Key: key,
    Body: new Uint8Array(arrayBuffer), // 👈 dùng Uint8Array thay vì File
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000",
  });

  await s3.send(command);

  return {
    bucket: PUBLIC_BUCKET,
    key,
    url: `https://${PUBLIC_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`,
  };
}