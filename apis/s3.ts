import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { api } from ".";
// ============================
// CONFIG
// ============================

const S3_REGION = "ap-southeast-1";
const PUBLIC_BUCKET = "ngoc-tieu-cac";
const PRIVATE_BUCKET = "ngoc-tieu-cac-private";
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
      return creds; // Token vẫn dùng được
    }
  }

  // 2. Hết hạn → gọi API lấy token mới
  const res = await api.get("admin/token");

  const newCreds = res.data;

  // 3. Lưu vào localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newCreds));

  return newCreds;
}

// ============================
// UPLOAD FUNCTION
// ============================

export async function uploadToS3(file: File) {
    
}
