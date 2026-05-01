import express from "express";
import { getDB, getCollection, getCollectionCloud } from "./db.js";
import cors from "cors";


const app = express();
app.use(express.json());
app.use(cors())

const CHAPTERS = "chapters";
const BOOKS = "books";

// ===== GET CHAPTERS =====
app.get("/chapters/:slug", async (req, res) => {
  try {
    const chaptersCol = await getCollection(CHAPTERS);
    const { slug } = req.params;
    const rs = await chaptersCol
      .find({ slug }).sortBy({ chapterNumber: 1 })
      .toArray();
    return res.json(rs); // ✅ QUAN TRỌNG
  } catch (err) {
    console.error("GET /chapters error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST bulk chapters theo bookSlug
app.post("/api/books/:bookSlug/chapters", async (req, res) => {
  try {

    const chaptersCol = getCollection(CHAPTERS);
    const booksCol = getCollectionCloud(BOOKS);

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
    await booksCol.collection("books").updateOne(
      { slug: bookSlug },
      {
        $set: {
          currentChapter: maxChapterNumber,
          updatedAt: new Date(),
        },
      }
    );

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

// ===== START SERVER =====


// ===== INIT SERVER =====
const startServer = async () => {
  await getDB(); // 👈 chỉ gọi 1 lần

  app.listen(3001, () => {
    console.log("🚀 Server running at http://localhost:3001");
  });
};

startServer()