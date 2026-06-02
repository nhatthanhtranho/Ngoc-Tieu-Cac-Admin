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

const WORKERS = 5;

function sleep(ms) {
    return new Promise((resolve) =>
        setTimeout(resolve, ms)
    );
}

function randomDelay() {
    return Math.floor(Math.random() * 1000) + 500;
}

async function loadCookies(page) {
    if (!fs.existsSync(COOKIE_FILE)) {
        throw new Error(
            `Không tìm thấy ${COOKIE_FILE}`
        );
    }

    const cookies = JSON.parse(
        fs.readFileSync(COOKIE_FILE, "utf8")
    );

    await page.setCookie(...cookies);

    console.log(
        `🍪 Loaded ${cookies.length} cookies`
    );
}

async function ensureIndexes() {
    const chapterCollection =
        await getCollection(
            "tiem-truyen-chu-chapters"
        );

    await chapterCollection.createIndex(
        {
            bookId: 1,
            chapterNumber: 1,
        },
        {
            unique: true,
        }
    );

    const storyCollection =
        await getCollection(
            "tiem-truyen-chu"
        );

    await storyCollection.createIndex({
        crawlStatus: 1,
        processing: 1,
    });

    console.log("✅ Indexes ready");
}

async function getNextStory() {
    const collection = await getCollection(
        "tiem-truyen-chu"
    );

    const result =
        await collection.findOneAndUpdate(
            {
                id: {
                    $exists: true,
                },
                crawlStatus: {
                    $ne: "done",
                },
                processing: {
                    $ne: true,
                },
            },
            {
                $set: {
                    processing: true,
                    processingAt:
                        new Date(),
                },
            },
            {
                returnDocument:
                    "after",
            }
        );

    return result;
}

async function fetchStoryDetail(
    page,
    storyId
) {
    const url = `https://tiemtruyenchu.cloud/api/v1/stories/${storyId}`;

    return await page.evaluate(
        async (apiUrl) => {
            const controller =
                new AbortController();

            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 30000);

            try {
                const res = await fetch(
                    apiUrl,
                    {
                        method: "GET",
                        credentials:
                            "include",
                        headers: {
                            accept:
                                "application/json",
                        },
                        signal:
                            controller.signal,
                    }
                );

                if (!res.ok) {
                    throw new Error(
                        `HTTP ${res.status}`
                    );
                }

                return await res.json();
            } finally {
                clearTimeout(timeout);
            }
        },
        url
    );
}

async function fetchWithRetry(
    page,
    storyId,
    retries = 3
) {
    let lastError;

    for (
        let i = 1;
        i <= retries;
        i++
    ) {
        try {
            return await fetchStoryDetail(
                page,
                storyId
            );
        } catch (err) {
            lastError = err;

            console.log(
                `⚠️ Story ${storyId} Retry ${i}/${retries}: ${err.message}`
            );

            await sleep(3000);
        }
    }

    throw lastError;
}

async function saveChapters(
    storyId,
    chapters
) {
    if (
        !Array.isArray(chapters) ||
        !chapters.length
    ) {
        return;
    }

    const collection =
        await getCollection(
            "tiem-truyen-chu-chapters"
        );

    const operations = chapters.map(
        (chapter) => ({
            updateOne: {
                filter: {
                    bookId: storyId,
                    chapterNumber:
                        chapter.chapterNumber,
                },
                update: {
                    $set: {
                        ...chapter,
                        bookId: storyId,
                    },
                },
                upsert: true,
            },
        })
    );

    const result =
        await collection.bulkWrite(
            operations,
            {
                ordered: false,
            }
        );

    console.log(
        `📚 Book ${storyId} | Upserted=${result.upsertedCount} Modified=${result.modifiedCount}`
    );
}

async function markDone(
    mongoId,
    totalChapters
) {
    const collection =
        await getCollection(
            "tiem-truyen-chu"
        );

    await collection.updateOne(
        {
            _id: mongoId,
        },
        {
            $set: {
                crawlStatus: "done",
                chapterSyncedAt:
                    new Date(),
                syncedChapters:
                    totalChapters,
            },
            $unset: {
                processing: "",
                processingAt: "",
            },
        }
    );
}

async function markError(
    mongoId,
    error
) {
    const collection =
        await getCollection(
            "tiem-truyen-chu"
        );

    await collection.updateOne(
        {
            _id: mongoId,
        },
        {
            $set: {
                crawlStatus: "error",
                lastError:
                    error?.toString(),
                errorAt: new Date(),
            },
            $unset: {
                processing: "",
                processingAt: "",
            },
        }
    );
}

async function worker(
    workerId,
    page
) {
    let processed = 0;

    while (true) {
        const story =
            await getNextStory();

        if (!story) {
            console.log(
                `[W${workerId}] ✅ No more jobs`
            );
            break;
        }

        try {
            console.log(
                `\n[W${workerId}] =====================================`
            );

            console.log(
                `[W${workerId}] 📖 ${story.title}`
            );

            console.log(
                `[W${workerId}] 🆔 ${story.id}`
            );

            const data =
                await fetchWithRetry(
                    page,
                    story.id
                );

            const chapters =
                data?.chapters ||
                [];

            console.log(
                `[W${workerId}] 📦 ${chapters.length} chapters`
            );

            await saveChapters(
                story.id,
                chapters
            );

            await markDone(
                story._id,
                chapters.length
            );

            processed++;

            console.log(
                `[W${workerId}] ✅ DONE ${story.id} (${processed})`
            );
        } catch (err) {
            console.error(
                `[W${workerId}] ❌ ${story.id}`,
                err
            );

            await markError(
                story._id,
                err.message
            );
        }

        await sleep(
            randomDelay()
        );
    }
}

async function createWorkerPage(
    browser,
    workerId
) {
    const page =
        await browser.newPage();

    await page.setViewport({
        width: 1366,
        height: 768,
    });

    await page.goto(
        "https://tiemtruyenchu.cloud",
        {
            waitUntil:
                "networkidle2",
        }
    );

    await loadCookies(page);

    await page.reload({
        waitUntil: "networkidle2",
    });

    console.log(
        `🚀 Worker ${workerId} ready`
    );

    return page;
}

async function main() {
    await ensureIndexes();

    const browser =
        await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        });

    try {
        const pages =
            await Promise.all(
                Array.from(
                    {
                        length:
                            WORKERS,
                    },
                    (_, index) =>
                        createWorkerPage(
                            browser,
                            index + 1
                        )
                )
            );

        await Promise.all(
            pages.map(
                (
                    page,
                    index
                ) =>
                    worker(
                        index + 1,
                        page
                    )
            )
        );
    } finally {
        await browser.close();
    }

    console.log(
        "\n🎉 ALL STORIES PROCESSED"
    );
}

main().catch((err) => {
    console.error(
        "💥 FATAL ERROR"
    );
    console.error(err);
});