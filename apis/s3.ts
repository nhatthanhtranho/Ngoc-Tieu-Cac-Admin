import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { api } from ".";

// ============================
// CONFIG
// ============================

const S3_REGION = "ap-southeast-1";
export const PUBLIC_BUCKET = "ngoc-tieu-cac";
export const PRIVATE_BUCKET = "ngoc-tieu-cac-private";
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
  const res = await api.get("admin/token");
  const newCreds = res.data;

  // 3. Lưu vào localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newCreds));

  return newCreds;
}

export async function uploadDataToS3(
  bucket: string,
  key: string,
  data: string
) {
  const creds = await getValidS3Credentials();

  // Tạo S3 client với temporary credentials
  const s3 = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken, // ⭐ Quan trọng khi dùng temp token
    },
  });

  // Xây command upload
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
  });

  // Upload
  await s3.send(command);

  return {
    bucket,
    key,
    url: `https://${bucket}.s3.${S3_REGION}.amazonaws.com/${key}`,
  };
}
