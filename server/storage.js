import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

import { r2 } from "./constants";

export async function getUploadChapterLink(
    slug,
    fileName,
    bucketName
) {
    try {
        const key = `${slug}/${fileName}`;
        const presignedPost =
            await createPresignedPost(r2, {
                Bucket: bucketName,
                Key: key,
                Fields: {
                    key,
                },
                Expires: 3600,
            });

        return {
            success: true,
            storageType: "r2",
            visibility: "private",
            url: presignedPost.url,
            fields: presignedPost.fields,
            key,
            expiresIn: 3600,
        };
    } catch (err) {
        console.error(
            "getUploadLink error:",
            err
        );
        return {
            success: false,
            message: "Internal server error",
            error: err.message,
        };
    }
}