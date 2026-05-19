import { S3Client } from "@aws-sdk/client-s3";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import dotenv from "dotenv";

dotenv.config();

const R2_ENDPOINT = "https://966888c99d59af76accec00f3980c517.r2.cloudflarestorage.com";
export const PRIVATE_BUCKET = "ngoc-tieu-cac";
export const PUBLIC_BUCKET = "ngoc-tieu-cac-public";

// eslint-disable-next-line no-undef
export const { S3_PUBLIC_KEY_ID, S3_PRIVATE_KEY_ID, R2_PUBLIC_KEY_ID, R2_PRIVATE_KEY_ID } = process.env;

export const s3 = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: S3_PUBLIC_KEY_ID,
    secretAccessKey: S3_PRIVATE_KEY_ID,
  },
});

export const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
      accessKeyId: R2_PUBLIC_KEY_ID,
      secretAccessKey: R2_PRIVATE_KEY_ID,
  },
});

export const cloudwatch = new CloudWatchLogsClient({
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

export const CATEGORIES = ["tien-hiep", 'he-thong', 'di-gioi', 'trong-sinh', 'huyen-huyen', 'mat-the', 'dong-nhan', 'khoa-huyen', 'tay-phuong', 'dong-phuong', 'linh-di', 'do-thi', 'hien-dai', 'vo-dich', 'vo-si', 'hai-huoc']

export const BANNER_SLUGS = [
  "toan-dan-chuyen-chuc-tu-linh-phap-su-ta-tuc-la-thien-tai",
  "nhat-kiem-ba-thien",
  "vo-tan-nhac-vien",
  "ty-ty-la-ma-giao-giao-chu",
  "khong-phai-chu-ban-gai-ao-cua-ta-sao-lai-tu-thanh-kiem-tien-roi",
  "deu-trong-sinh-ai-con-xa-hoi-den",
  "bat-lay-ma-tu-kia",
  "tuyet-doi-van-menh-tro-choi",
  // "ta-tai-vinh-da-che-tao-noi-an-nup",
  // "lay-mot-long-chi-luc-danh-bai-toan-bo-the-gioi",
  // "cau-tai-vo-dao-the-gioi-thanh-thanh",
  "theo-gia-pha-bat-dau-che-tao-truong-sinh-the-gia",
  "moi-ngay-mot-que-tu-phuong-thi-tan-tu-den-truong-sinh-tien-ton",
  "kiem-lai",
  "truong-sinh-luyen-khi-su",
  "quy-bi-chi-chu-phan-2",
  "tu-minh-tu-thanh-nguoi-duoi-quy",
  "ta-khong-phai-hi-than",
  // "hu-hoa-cau-sinh"
]