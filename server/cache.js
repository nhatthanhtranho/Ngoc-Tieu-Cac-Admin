import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN } = process.env;

export async function refreshCache(slug) {
    try {
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
            {
                files: [`https://assets.itruyenchu.org/book-cover/${slug}/banner.webp`,
                `https://assets.itruyenchu.org/book-cover/${slug}/small-banner.webp`,
                `https://assets.ngoctieucac.link/book-cover/${slug}/banner.webp`,
                `https://assets.ngoctieucac.link/book-cover/${slug}/small-banner.webp`],
            },
            {
                headers: {
                    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Cache purged:", response.data);
        return response.data;
    } catch (err) {
        console.error("❌ Purge cache failed:", err);
        throw err;
    }
}