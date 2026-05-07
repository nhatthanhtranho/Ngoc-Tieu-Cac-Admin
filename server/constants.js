import { S3Client } from "@aws-sdk/client-s3";

const BUCKET = "assets.itruyenchu.com";
const PRIVATE_BUCKET = "ngoc-tieu-cac";
const { S3_PUBLIC_KEY_ID, S3_PRIVATE_KEY_ID } = process.env;

export const s3 = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: S3_PUBLIC_KEY_ID,
    secretAccessKey: S3_PRIVATE_KEY_ID,
  },
});
export const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.50.163:3000",
];
