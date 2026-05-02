import express from "express";
import { getDB, getCollection, getCollectionCloud, getDBCloud } from "./db.js";
import cors from "cors";
import { getRelatedBooks } from "./books.js";
import { strToU8, gzipSync } from "fflate";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();



const {
  S3_PUBLIC_KEY_ID,
  S3_PRIVATE_KEY_ID,
  // eslint-disable-next-line no-undef
} = process.env;

const BUCKET = "assets.itruyenchu.com";


const s3 = new S3Client({
  region: 'ap-southeast-1',
  credentials: {
    accessKeyId: S3_PUBLIC_KEY_ID,
    secretAccessKey: S3_PRIVATE_KEY_ID,
  },
});

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

const CHAPTERS = "chapters";
const BOOKS = "books";
const PAYMENT_REQUESTS = "payment_requests";

app.get("/slugs", async (req, res) => {
  try {
    const booksCol = await getCollectionCloud(BOOKS);

    const slugs = await booksCol
      .find()
      .project({ slug: 1, _id: 0, title: 1, currentChapter: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(slugs); // ✅ QUAN TRỌNG
  } catch (err) {
    console.error("GET /slugs error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/payment-requests", async (req, res) => {
  try {
    const paymentCol = await getCollectionCloud(PAYMENT_REQUESTS);
    const [topupCount, premiumCount] = await Promise.all([
      paymentCol.countDocuments({ status: "pending", type: "topup" }),
      paymentCol.countDocuments({ status: "pending", type: "membership" })
    ]);
    return res.json({
      topup: topupCount,
      membership: premiumCount
    }); // ✅ QUAN TRỌNG
  } catch (err) {
    console.error("GET /chapters error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ===== GET CHAPTERS =====
app.get("/chapters/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const chaptersCol = await getCollection(CHAPTERS);
    const rs = await chaptersCol
      .find({ slug }).sort({ chapterNumber: 1 })
      .toArray();
    return res.json(rs); // ✅ QUAN TRỌNG
  } catch (err) {
    console.error("GET /chapters error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/chapters/:slug/sync", async (req, res) => {
  try {
    const { slug } = req.params;
    const booksCol = await getCollectionCloud(BOOKS);
    const chaptersCol = await getCollection(CHAPTERS);

    const book = await booksCol.findOne({ slug });
    if (!book) {
      return res.status(400).json({
        message: `${slug} not found in books collection`,
      });
    }
    const relatedBooks = await getRelatedBooks(booksCol, book)

    const bookWithRelated = {
      ...book,
      relatedBooks,
    };

    let chapters = await chaptersCol
      .find({ slug })
      .project({ title: 1, chapterNumber: 1, _id: 0 })
      .sort({ chapterNumber: 1 })
      .toArray();

    // Map & reduce thành object { chapterNumber: {title, createdAt} }
    chapters = chapters.reduce((acc, chap) => {
      acc[chap.chapterNumber] = {
        title: chap.title,
        createdAt: chap.createdAt,
      };
      return acc;
    }, {});
    const chapterJSON = JSON.stringify(chapters);
    const compressed = gzipSync(strToU8(chapterJSON));

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `books/${slug}.json`,
        Body: JSON.stringify(bookWithRelated),
        ContentType: "application/json",
      }),
    );

    // Upload compressed chapters JSON
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `chapters/${slug}.json.gz`,
        Body: compressed,
        ContentType: "application/gzip",
      }),
    );

    return res.status(200).json({ "message": "Sync successful" });

  } catch (err) {
    console.error("GET /chapters error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST bulk chapters theo bookSlug
app.post("/chapters/:bookSlug", async (req, res) => {
  try {

    const chaptersCol = await getCollection(CHAPTERS);
    const booksCol = await getCollectionCloud(BOOKS);

    const { bookSlug } = req.params;
    const chapters = req.body; // expect array

    if (!Array.isArray(chapters)) {
      return res.status(400).json({
        message: "chapters must be an array",
      });
    }

    // ===== UPSERT BULK =====
    if (chapters.length > 0) {
      const ops = chapters.map((chapter) => ({
        updateOne: {
          filter: {
            slug: bookSlug,
            chapterNumber: chapter.chapterNumber,
          },
          update: {
            $set: {
              title: chapter.title,
              slug: bookSlug,
              chapterNumber: chapter.chapterNumber,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      await chaptersCol.bulkWrite(ops);
    }

    // ===== GET MAX CHAPTER =====
    const maxChapter = await chaptersCol
      .find({ slug: bookSlug })
      .sort({ chapterNumber: -1 })
      .limit(1)
      .toArray();

    const maxChapterNumber = maxChapter[0]?.chapterNumber ?? 0;

    // ===== UPDATE BOOK =====
    await booksCol.updateOne(
      { slug: bookSlug },
      {
        $set: {
          currentChapter: maxChapterNumber,
          updatedAt: new Date(),
        },
      }
    ).then(rs => console.log(rs));

    return res.json({
      message: "success",
      currentChapter: maxChapterNumber,
    });
  } catch (err) {
    console.error("POST bulk chapters error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

const startServer = async () => {
  await getDB(); // 👈 chỉ gọi 1 lần
  await getDBCloud()

  app.listen(3001, () => {
    console.log("🚀 Server running at http://localhost:3001");
  });
};

startServer();