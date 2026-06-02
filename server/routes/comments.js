import { Router } from 'express'
import { getCollectionCloud } from '../db.js';

export const commentRouter = Router();

const COMMENTS = "comments";
const SEEDS = "seeds"


commentRouter.get("/real", async (req, res) => {
  try {
    const commentsCol = await getCollectionCloud(COMMENTS);

    const comments = await commentsCol
      .find({
        type: "r", // review
      })
      .project({
        content: 1,
        username: 1,
        createdAt: 1,
        slug: 1,
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return res.json(comments);
  } catch (err) {
    console.error("GET /real-comments error:", err);
    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
});

commentRouter.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const commentsCol = await getCollectionCloud(COMMENTS);

    const comments = await commentsCol
      .find({ slug })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ comments }); // ✅ QUAN TRỌNG
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

commentRouter.post("/", async (req, res) => {
  try {
    const {
      bookSlug,
      username,
      avatarUrl,
      content,
      parentId,
      random,
      converter,
      randomCreatedDate,
    } = req.body;

    if (!content) {
      return res.status(400).json({
        message: "Content bị thiếu!",
      });
    }

    if (random !== true && (!bookSlug || !username)) {
      return res.status(400).json({
        message: "bookSlug, username bị thiếu!",
      });
    }

    const commentsCol = await getCollectionCloud(COMMENTS);
    const seedUsersCol = await getCollectionCloud(SEEDS);

    let finalUsername = username;
    let finalAvatar = avatarUrl || null;

    /* ================= RANDOM USER ================= */
    if (random === true) {
      const [seedUser] = await seedUsersCol
        .aggregate([{ $sample: { size: 1 } }])
        .toArray();

      if (!seedUser) {
        return res.status(400).json({
          message: "Chưa có seed user nào!",
        });
      }

      finalUsername = seedUser.username;
      finalAvatar = seedUser.avatarUrl || null;
    } else {
      // 👉 tạo seed user nếu chưa tồn tại
      await seedUsersCol.findOneAndUpdate(
        { username: finalUsername },
        {
          $setOnInsert: {
            username: finalUsername,
            avatarUrl: finalAvatar,
          },
        },
        { upsert: true }
      );
    }

    /* ================= RANDOM CREATED DATE ================= */
    let createdAt = new Date();

    if (randomCreatedDate === true) {
      const now = Date.now();
      const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;

      const randomTimestamp =
        Math.floor(Math.random() * (now - fiveDaysAgo)) + fiveDaysAgo;

      createdAt = new Date(randomTimestamp);
    }

    /* ================= INSERT COMMENT ================= */
    const newComment = {
      username: finalUsername,
      avatarUrl: finalAvatar,
      content,
      createdAt,
      parentId: parentId || null,
      slug: bookSlug,
      type: "s", // seed
      converter: converter || null,
    };

    const result = await commentsCol.insertOne(newComment);

    return res.json({
      message: "Add comment thành công",
      data: {
        ...newComment,
        _id: result.insertedId,
      },
    });
  } catch (err) {
    console.error("POST /admin/add-comment error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});