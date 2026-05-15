// utils/r2-upload.ts
import { S3Client, PutObjectCommand, } from "@aws-sdk/client-s3";
import axios from "axios";

import { BACKEND_URL } from "../src/constant";

const STORAGE_KEY = "r2_credentials";
const R2_ENDPOINT = "https://966888c99d59af76accec00f3980c517.r2.cloudflarestorage.com";
const PUBLIC_BUCKET = "ngoc-tieu-cac-public";
const PRIVATE_BUCKET = "ngoc-tieu-cac";

let r2Client: S3Client | null = null;

interface UploadR2Params {
    key: string;
    body: Blob | Uint8Array | string;
    contentType?: string;
    isPublic?: boolean;
}

async function getValidR2Credentials() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
        console.log(raw)
        return JSON.parse(raw);
    }

    const res = await axios.get(`${BACKEND_URL}/admin/token?isR2=true`);

    const newCreds = res.data;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCreds));

    return newCreds;
}

async function getR2Client(): Promise<S3Client> {
    if (r2Client) return r2Client;
    const creds = await getValidR2Credentials();
    r2Client = new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        forcePathStyle: true,
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
        },
    });

    return r2Client;

}

export async function uploadToR2({
    key,
    body,
    contentType = "application/octet-stream",
    isPublic = false,
}: UploadR2Params) {
    const client = await getR2Client();

    const command = new PutObjectCommand({
        Bucket: isPublic ? PUBLIC_BUCKET : PRIVATE_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    return client.send(command);
}