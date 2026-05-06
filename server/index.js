/* eslint-disable no-undef */
import express from "express";
import { getDB, getCollection, getCollectionCloud, getDBCloud } from "./db.js";
import cors from "cors";
import { getRelatedBooks } from "./books.js";
import { strToU8, gzipSync } from "fflate";
import {
  S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


dotenv.config();



export async function purgeCloudflareByUrls(urls = []) {
  try {
    if (!process.env.CF_API_TOKEN) {
      console.warn("⚠️ Missing CF_API_TOKEN");
      return;
    }

    if (!process.env.CF_ZONES) {
      console.warn("⚠️ Missing CF_ZONES");
      return;
    }

    const zones = process.env.CF_ZONES.split(",");

    for (const zoneId of zones) {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // eslint-disable-next-line no-undef
            Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          },
          body: JSON.stringify({
            files: urls,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        console.warn("⚠️ Cloudflare purge failed:", data);
      }
    }
  } catch (err) {
    console.error("❌ purgeCloudflareByUrls error:", err);
  }
}



const {
  S3_PUBLIC_KEY_ID,
  S3_PRIVATE_KEY_ID,
  // eslint-disable-next-line no-undef
} = process.env;

const BUCKET = "assets.itruyenchu.com";
const PRIVATE_BUCKET = "ngoc-tieu-cac"


const s3 = new S3Client({
  region: 'ap-southeast-1',
  credentials: {
    accessKeyId: S3_PUBLIC_KEY_ID,
    secretAccessKey: S3_PRIVATE_KEY_ID,
  },
});
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.50.163:3000"
];

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json());

const CHAPTERS = "chapters";
const BOOKS = "books";
const PAYMENT_REQUESTS = "payment_requests";
const SEEDS = "seeds";
const COMMENTS = "comments";

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

app.post("/slugs", async (req, res) => {
  try {
    const slugs = req.body.slugs
    const booksCol = await getCollectionCloud(BOOKS);

    const books = await booksCol
      .find({ slug: { $in: slugs } })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(books); // ✅ QUAN TRỌNG
  } catch (err) {
    console.error("GET /slugs error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/converters", async (req, res) => {
  try {
    const seedsCol = await getCollectionCloud(SEEDS);

    const converters = await seedsCol
      .find()
      .project({ _id: 0, username: 1 }) // chỉ trả username
      .toArray();

    return res.json(converters); // ✅ QUAN TRỌNG
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


app.get("/comments/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const commentsCol = await getCollectionCloud(COMMENTS);

    const comments = await commentsCol
      .find({ slug })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({comments}); // ✅ QUAN TRỌNG
  } catch (err) {
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

app.post("/admin/add-comment", async (req, res) => {
  try {
    // 👉 nếu có auth middleware thì verify ở đây
    // const admin = await verifyToken(req, true);
    // if (!admin) {
    //   return res.status(401).json({ message: "Unauthorized!" });
    // }

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

    /* ================= PURGE CLOUDFLARE ================= */
    try {
      await purgeCloudflareByUrls([
        `https://api.ngoctieucac.link/comments/${bookSlug}`,
      ]);
    } catch (e) {
      console.warn("⚠️ Cloudflare purge failed:", e.message);
    }

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


// DELETE CHAPTERS
// ===== helper: delete theo prefix (handle pagination) =====
async function deleteByPrefix(bucket, prefix) {
  let isTruncated = true;
  let continuationToken = undefined;

  while (isTruncated) {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    if (res.Contents && res.Contents.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: res.Contents.map((obj) => ({
              Key: obj.Key,
            })),
          },
        })
      );
    }

    isTruncated = res.IsTruncated;
    continuationToken = res.NextContinuationToken;
  }
}

// ===== helper: delete nhiều key lẻ =====
async function deleteKeys(bucket, keys = []) {
  if (!keys.length) return;

  await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((k) => ({ Key: k })),
      },
    })
  );
}

app.get("/books/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        message: "Missing slug parameter",
      });
    }

    const booksCol = await getCollectionCloud(BOOKS);

    const book = await booksCol.findOne({ slug });

    if (!book) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin sách",
      });
    }

    return res.json(book);
  } catch (error) {
    console.error("GET /books/:slug error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});


// ===== ROUTE =====
app.delete("/chapters/:bookSlug", async (req, res) => {
  try {
    const { bookSlug } = req.params;

    const chaptersCol = await getCollection(CHAPTERS);
    const booksCol = await getCollectionCloud(BOOKS);

    // ===== 1. DELETE DB =====
    await chaptersCol.deleteMany({ slug: bookSlug });

    await booksCol.updateOne(
      { slug: bookSlug },
      {
        $set: {
          currentChapter: 0,
          updatedAt: new Date(),
        },
      }
    );

    // ===== 2. DELETE S3 =====
    // a. delete chapters folder
    await deleteByPrefix(BUCKET, `${bookSlug}/`);

    // b. delete preview folder (chuong-x.txt)
    await deleteByPrefix(BUCKET, `preview/${bookSlug}/`);

    // c. delete file lẻ trong bucket chính
    await deleteKeys(BUCKET, [
      `public/${bookSlug}`,
      `${bookSlug}`,
    ]);

    // d. delete ở bucket khác
    await deleteKeys("ngoc-tieu-cac", [
      `${bookSlug}`,
    ]);

    return res.json({
      message: "deleted all chapters + S3 cleaned",
      currentChapter: 0,
    });
  } catch (err) {
    console.error("DELETE /chapters error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});


app.get("/payment-requests-list", async (req, res) => {
  try {
    // nếu bạn có middleware auth thì dùng ở đây
    // const decoded = await verifyToken(req);
    // if (!decoded) {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }

    const q = req.query || {};

    const topUpType = q.topUpType;
    const search = q.search || null;
    const status = q.status || null;
    const startDate = q.startDate || null;
    const endDate = q.endDate || null;

    const page = parseInt(q.page || "1");
    const limit = parseInt(q.limit || "20");
    const skip = (page - 1) * limit;

    const query = {};

    // 🔎 search
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // 🧾 type
    if (topUpType) {
      query.type = topUpType;
    }

    // 🟧 status
    if (status) {
      query.status = status;
    }

    // 📅 date range
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query.createdAt.$lte = end;
      }
    }

    const paymentCol = await getCollectionCloud(PAYMENT_REQUESTS);

    // 🔢 total
    const total = await paymentCol.countDocuments(query);

    // 📦 data
    const data = await paymentCol
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return res.json({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /payment-requests error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/books", async (req, res) => {
  try {
    // TODO: nếu có auth middleware thì verify ở đây
    // const user = await verifyToken(req)
    // if (!user) return res.status(401).json({ message: "Unauthorized" });

    const bookData = req.body;

    if (!bookData.slug) {
      return res.status(400).json({
        message: "Missing slug",
      });
    }

    const booksCol = await getCollectionCloud(BOOKS);

    // 👉 normalize slugSearch giống Lambda
    const slugSearch = bookData.slug
      .trim()
      .toLowerCase()
      .replace(/-/g, " ");

    // 👉 check duplicate slug (rất nên có)
    const existed = await booksCol.findOne({ slug: bookData.slug });
    if (existed) {
      return res.status(409).json({
        message: "Book with this slug already exists",
      });
    }

    const now = new Date();

    const dataToInsert = {
      ...bookData,
      slugSearch,
      ...(bookData.updated === true
        ? { updatedAt: now }
        : { createdAt: now }),
    };

    const result = await booksCol.insertOne(dataToInsert);

    return res.status(201).json({
      ...dataToInsert,
      _id: result.insertedId,
    });
  } catch (err) {
    console.error("POST /books error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

app.get("/chapters/download-link/:bookSlug", async (req, res) => {
  try {
    const { bookSlug } = req.params;
    const { filename, isPublic, isAudio } = req.query;

    if (!bookSlug || !filename) {
      return res.status(400).json({
        message: "Missing bookSlug or filename",
      });
    }

    const downloadPublic = isPublic === "1";
    const downloadAudio = isAudio === "1";

    const bucket = downloadPublic ? BUCKET : PRIVATE_BUCKET;

    // 🎯 build key giống upload
    let keyPrefix = "";

    if (downloadPublic) {
      keyPrefix = downloadAudio
        ? `audio-free/${bookSlug}/`
        : `free/${bookSlug}/`;
    } else {
      keyPrefix = downloadAudio
        ? `audio/${bookSlug}/`
        : `${bookSlug}/`;
    }

    const finalKey = `${keyPrefix}${filename}`;

    // ✅ public → trả thẳng URL
    if (downloadPublic) {
      return res.json({
        url: `https://${bucket}.s3.amazonaws.com/${finalKey}`,
        key: finalKey,
        public: true,
      });
    }

    // 🔐 private → signed URL
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: finalKey,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    return res.json({
      url: signedUrl,
      key: finalKey,
      expiresIn: 3600,
      visibility: "private",
    });
  } catch (err) {
    console.error("GET /chapters/download-link error:", err);
    return res.status(500).json({
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