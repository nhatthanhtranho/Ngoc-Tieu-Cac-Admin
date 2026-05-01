import express from "express";
import { getCollection } from "./db.js";

const app = express();
app.use(express.json());

const COLLECTION = "chapters";

// ===== GET CHAPTERS =====
app.get("/api/chapters", async (req, res) => {
  try {
    const col = await getCollection(COLLECTION);

    const { page = 1, limit = 10, keyword } = req.query;

    const query = {};

    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      col.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .toArray(),
      col.countDocuments(query),
    ]);

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (err) {
    console.error("GET /chapters error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== POST CHAPTER =====
app.post("/api/chapters", async (req, res) => {
  try {
    const col = await getCollection(COLLECTION);

    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "Missing title or content",
      });
    }

    const newChapter = {
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(newChapter);

    res.json({
      message: "Created",
      id: result.insertedId,
    });
  } catch (err) {
    console.error("POST /chapters error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== START SERVER =====
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});