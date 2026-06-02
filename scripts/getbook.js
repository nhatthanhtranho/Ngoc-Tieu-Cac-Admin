import fs from "fs";
import puppeteer from "puppeteer";
import { getCollection } from "./db.js";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COOKIE_FILE = path.join(
    __dirname,
    "cookie.json"
);

const START_PAGE = 40;
const END_PAGE = 1000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
    return Math.floor(Math.random() * 1000);
}

async function loadCookies(page) {
    if (!fs.existsSync(COOKIE_FILE)) {
        throw new Error(`Không tìm thấy ${COOKIE_FILE}`);
    }

    const cookies = JSON.parse(
        fs.readFileSync(COOKIE_FILE, "utf8")
    );

    await page.setCookie(...cookies);

    console.log(`🍪 Loaded ${cookies.length} cookies`);
}

async function fetchStories(page, pageNumber) {
    const url = `https://tiemtruyenchu.cloud/api/v1/stories?type=truyen-cv&status=full&page=${pageNumber}&sort=new&limit=100`;

    return await page.evaluate(async (apiUrl) => {
        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 30000);

        try {
            const res = await fetch(apiUrl, {
                method: "GET",
                credentials: "include",
                headers: {
                    accept: "application/json",
                },
                signal: controller.signal,
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            return await res.json();
        } finally {
            clearTimeout(timeout);
        }
    }, url);
}

async function fetchWithRetry(
    page,
    pageNumber,
    retries = 3
) {
    let lastError;

    for (let i = 1; i <= retries; i++) {
        try {
            return await fetchStories(page, pageNumber);
        } catch (err) {
            lastError = err;

            console.log(
                `⚠️ Retry ${i}/${retries}: ${err.message}`
            );

            await sleep(5000);
        }
    }

    throw lastError;
}

async function saveItems(items) {
    if (!Array.isArray(items) || !items.length) {
        return;
    }

    const collection = await getCollection(
        "tiem-truyen-chu"
    );

    const operations = items
        .filter((item) => item?.slug)
        .map((item) => ({
            updateOne: {
                filter: {
                    slug: item.slug,
                },
                update: {
                    $set: item,
                },
                upsert: true,
            },
        }));

    if (!operations.length) {
        return;
    }

    const result = await collection.bulkWrite(
        operations,
        {
            ordered: false,
        }
    );

    console.log(
        `✅ Upserted=${result.upsertedCount} Modified=${result.modifiedCount} Matched=${result.matchedCount}`
    );
}

async function main() {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
    });

    try {
        const page = await browser.newPage();

        await page.setViewport({
            width: 1366,
            height: 768,
        });

        await page.goto(
            "https://tiemtruyenchu.cloud",
            {
                waitUntil: "networkidle2",
            }
        );

        await loadCookies(page);

        await page.reload({
            waitUntil: "networkidle2",
        });

        for (
            let currentPage = START_PAGE;
            currentPage <= END_PAGE;
            currentPage++
        ) {
            try {
                console.log(
                    "\n========================================"
                );
                console.log(
                    `📖 PAGE ${currentPage}`
                );

                const data = await fetchWithRetry(
                    page,
                    currentPage
                );

                const items =
                    data?.items ||
                    data?.data?.items ||
                    data?.stories ||
                    [];

                console.log(
                    `📦 Found ${items.length} items`
                );

                if (!items.length) {
                    console.log(
                        "⚠️ Không còn dữ liệu, dừng crawl."
                    );
                    break;
                }

                await saveItems(items);
            } catch (err) {
                console.error(
                    `❌ PAGE ${currentPage}`,
                    err
                );
            }

            const delay = randomDelay();

            console.log(
                `⏳ Sleep ${Math.round(
                    delay / 1000
                )}s`
            );

            await sleep(delay);
        }
    } finally {
        await browser.close();
    }

    console.log("🎉 DONE");
}

main().catch((err) => {
    console.error("💥 FATAL ERROR");
    console.error(err);
});