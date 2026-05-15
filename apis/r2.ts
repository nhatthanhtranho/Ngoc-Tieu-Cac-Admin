// utils/r2-upload.ts
import { S3Client, PutObjectCommand, } from "@aws-sdk/client-s3";
import axios from "axios";

import { BACKEND_URL } from "../src/constant";

const STORAGE_KEY = "r2_credentials";
const R2_ENDPOINT = "https://966888c99d59af76accec00f3980c517.r2.cloudflarestorage.com";

let r2Client: S3Client | null = null;

interface UploadR2Params {
    endpoint: string;
    bucket: string;
    key: string;
    body: Blob | Uint8Array | string;
    contentType?: string;
}

async function getValidR2Credentials() {
    // 1. Lấy từ localStorage
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
        const creds = JSON.parse(raw);
        if (creds) {
            return creds;
        }
    }

    const res = await axios.get(`${BACKEND_URL}/admin/token`);
    const newCreds = res;

    // 3. Lưu vào localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCreds));
    return newCreds;
}

async function getR2Client(): Promise<S3Client> {
    if (r2Client) return r2Client;
    const creds = await getValidR2Credentials();
    r2Client = new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
        },
    });

    return r2Client;

}

export async function uploadToR2({
    bucket,
    key,
    body,
    contentType = "application/octet-stream",
}: UploadR2Params) {
    const client = await getR2Client();

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    return client.send(command);
}