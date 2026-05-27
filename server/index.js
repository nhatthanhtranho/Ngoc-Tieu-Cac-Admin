/* eslint-disable no-undef */
import express from "express";
import { getDB, getCollection, getCollectionCloud, getDBCloud } from "./db.js";
import cors from "cors";
import { getRelatedBooks } from "./books.js";
import { strToU8, gzipSync } from "fflate";
import {
  PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { ObjectId } from "mongodb";
import {
  StartQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { allowedOrigins, s3, PRIVATE_BUCKET, cloudwatch, S3_PUBLIC_KEY_ID, S3_PRIVATE_KEY_ID, r2, PUBLIC_BUCKET } from "./constants.js";
import { generateHomePage } from "./home.mjs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { refreshCache } from "./cache.js";

async function runLogQuery(logGroupName, queryString, startTime, endTime) {
  const start = await cloudwatch.send(
    new StartQueryCommand({
      logGroupName,
      startTime,
      endTime,
      queryString,
    })
  );

  let results;

  while (true) {
    const res = await cloudwatch.send(
      new GetQueryResultsCommand({
        queryId: start.queryId,
      })
    );

    if (res.status === "Complete") {
      results = res.results;
      break;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return results.map((row) => {
    const obj = {};

    row.forEach((i) => {
      obj[i.field] = i.value;
    });

    return obj;
  });
}

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


app.get("/reset-cache", async (req, res) => {
  try {
    const slug = req.query.slug;

    const result = await refreshCache(slug);

    return res.json({
      message: "Cache refresh triggered",
      result,
    });
  } catch (err) {
    console.error("GET /cache error:", err);
    return res.status(500).json({ error: err.message });
  }
});


app.get("/real-comments", async (req, res) => {
  try {
    // nếu cần auth giống Lambda thì bật lại
    // const user = await verifyToken(req, true);
    // if (!user) {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }

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


app.get("/slugs", async (req, res) => {
  try {
    const booksCol = await getCollectionCloud(BOOKS);

    const slugs = await booksCol
      .find()
      .project({ slug: 1, _id: 0, title: 1, currentChapter: 1, categories: 1, storage: 1 })
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

app.get("/generate", async (req, res) => {
  try {

    const booksCol = await getCollectionCloud(BOOKS);

    await generateHomePage(booksCol)

    return res.json({ message: "Done" }); // ✅ QUAN TRỌNG
  } catch (err) {
    console.error("GET /slugs error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/books/slugs", async (req, res) => {
  try {
    const { slugs } = req.body || {};

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return res.json([]);
    }

    const booksCol = await getCollectionCloud(BOOKS);

    const books = await booksCol
      .find({
        slug: {
          $in: slugs,
        },
      })
      .toArray();

    // 👉 Sort theo đúng thứ tự slug truyền lên
    const ordered = slugs.map(
      (slug) => books.find((b) => b.slug === slug) || null
    );

    return res.json(ordered);
  } catch (err) {
    console.error("POST /getBookBySlugs error:", err);

    return res.status(500).json({
      message: "Lỗi server",
      error: err?.message,
    });
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

    return res.json({ comments }); // ✅ QUAN TRỌNG
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/payment-requests", async (req, res) => {
  try {
    const paymentCol = await getCollectionCloud(PAYMENT_REQUESTS);
    const [topupCount, premiumCount] = await Promise.all([
      paymentCol.countDocuments({ status: "pending", type: "topup" }),
      paymentCol.countDocuments({ status: { $in: ["pending", "auto_approved"] }, type: "membership" })
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

    await r2.send(
      new PutObjectCommand({
        Bucket: PUBLIC_BUCKET,
        Key: `books/${slug}.json`,
        Body: JSON.stringify(bookWithRelated),
        ContentType: "application/json",
      }),
    );

    // Upload compressed chapters JSON
    await r2.send(
      new PutObjectCommand({
        Bucket: PUBLIC_BUCKET,
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
    await deleteByPrefix(PUBLIC_BUCKET, `${bookSlug}/`);

    // b. delete preview folder (chuong-x.txt)
    await deleteByPrefix(PUBLIC_BUCKET, `preview/${bookSlug}/`);

    // c. delete file lẻ trong bucket chính
    await deleteKeys(PUBLIC_BUCKET, [
      `public/${bookSlug}`,
      `${bookSlug}`,
    ]);

    // d. delete ở bucket khác
    await deleteKeys(PRIVATE_BUCKET, [
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

app.post("/payment-requests/change-status-to-approved", async (req, res) => {
  try {
    const { paymentRequestId } = req.body;

    if (!paymentRequestId) {
      return res.status(400).json({ message: "Thiếu paymentRequestId." });
    }

    // 👉 Nếu bạn có hàm verifyToken trong Express thì dùng ở đây
    // const approver = await verifyToken(req, true);
    // if (!approver) return res.status(403).json({ message: "Bạn không có quyền." });

    const paymentCol = await getCollectionCloud(PAYMENT_REQUESTS);
    const usersCol = await getCollectionCloud("users");

    const paymentId = new ObjectId(paymentRequestId);
    const now = new Date();

    // 1. Tìm yêu cầu thanh toán
    const paymentRequest = await paymentCol.findOne({ _id: paymentId });
    if (!paymentRequest) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu thanh toán." });
    }

    if (paymentRequest.status === "approved") {
      return res.status(400).json({ message: "Yêu cầu này đã được xử lý." });
    }

    // 2. Kiểm tra User tồn tại (optional nhưng nên có theo logic cũ của bạn)
    const userId = new ObjectId(paymentRequest.userId);
    const user = await usersCol.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại." });
    }

    // 3. Cập nhật trạng thái
    // Lưu ý: Nếu muốn dùng Transaction thật sự, bạn cần setup replica set và dùng session của mongodb.
    // Ở đây tôi giữ logic update đơn giản như code Lambda cũ của bạn.
    const updateResult = await paymentCol.updateOne(
      { _id: paymentId },
      { $set: { status: "approved", approvedAt: now } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: "Không thể duyệt yêu cầu." });
    }

    return res.json({ message: "Duyệt yêu cầu thành công." });

  } catch (err) {
    console.error("❌ Error in /payment-requests/change-status-to-approved:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message
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

app.post("/updatebook/:bookSlug", async (req, res) => {
  try {
    const { bookSlug } = req.params;

    if (!bookSlug) {
      return res.status(400).json({
        message: "Missing bookSlug",
      });
    }

    if (!req.body) {
      return res.status(400).json({
        message: "Missing request body",
      });
    }

    // 👉 nếu cần auth thì bật lại
    // const user = await verifyToken(req, true);
    // if (!user) {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }

    const data = req.body;
    const now = new Date();

    const booksCol = await getCollectionCloud(BOOKS);

    const updateData = {
      ...data,
      ...(data.updated === true
        ? { updatedAt: now }
        : { createdAt: now }),
    };

    // ❌ không cho client ghi đè flag này
    delete updateData.updated;

    const result = await booksCol.findOneAndUpdate(
      { slug: bookSlug },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.json(result.value);
  } catch (err) {
    console.error("PATCH /book/:bookSlug error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
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
      storage: "r2",
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

const privateBucket = "ngoc-tieu-cac";
const publicBucket = "assets.itruyenchu.com";

const privateR2Bucket = "ngoc-tieu-cac";
const publicR2Bucket = "ngoc-tieu-cac-public";


app.post("/chapters/upload-link/:bookSlug", async (req, res) => {
  try {
    const { bookSlug } = req.params;
    const { isPublic } = req.query;

    const {
      fileName,
      storageType = "r2", // ✅ default R2
    } = req.body;

    if (!bookSlug) {
      return res.status(400).json({
        message: "Missing bookSlug",
      });
    }

    if (!fileName) {
      return res.status(400).json({
        message: "Missing fileName",
      });
    }

    const uploadPublic = isPublic === "1";

    /**
     * ✅ chọn client + bucket
     */

    const isR2 = storageType === "r2";

    const client = isR2 ? r2 : s3;

    const bucket = uploadPublic
      ? isR2
        ? publicR2Bucket
        : publicBucket
      : isR2
        ? privateR2Bucket
        : privateBucket;

    const previewBucket = isR2
      ? publicR2Bucket
      : publicBucket;

    const acl = "private";

    /**
     * 🎯 Build keyPrefix
     */

    let keyPrefix = "";

    if (uploadPublic) {
      keyPrefix = `free/${bookSlug}/`;
    } else {
      keyPrefix = `${bookSlug}/`;
    }

    let presignedPost;
    let previewPost;

    /**
     * ================= PUBLIC =================
     */

    if (uploadPublic) {
      presignedPost = await createPresignedPost(client, {
        Bucket: bucket,
        Key: `${keyPrefix}${fileName}`,
        Conditions: [["starts-with", "$key", keyPrefix]],
        Expires: 3600,
      });
    } else {
      /**
       * ================= PRIVATE =================
       */

      presignedPost = await createPresignedPost(client, {
        Bucket: bucket,
        Key: `${keyPrefix}${"${filename}"}`,
        Conditions: [
          ["starts-with", "$key", keyPrefix],
          ...(isR2 ? [] : [{ acl }]),
        ],
        Fields: isR2 ? {} : { acl },
        Expires: 3600,
      });

      /**
       * ================= PREVIEW =================
       */

      previewPost = await createPresignedPost(client, {
        Bucket: previewBucket,
        Key: `preview/${bookSlug}/${"${filename}"}`,
        Conditions: [
          [
            "starts-with",
            "$key",
            `preview/${bookSlug}/`,
          ],
        ],
        Expires: 3600,
      });
    }

    /**
     * ✅ public base url
     */

    let publicBaseUrl = null;

    if (uploadPublic) {
      if (isR2) {
        publicBaseUrl = `${process.env.R2_PUBLIC_URL}/${keyPrefix}`;
      } else {
        publicBaseUrl = `https://${bucket}.s3.amazonaws.com/${keyPrefix}`;
      }
    }

    return res.json({
      storageType,
      visibility: uploadPublic
        ? "public"
        : "private",

      url: presignedPost.url,

      preview: previewPost?.url || null,

      previewFields:
        previewPost?.fields || null,

      fields: presignedPost.fields,

      keyPrefix,

      publicBaseUrl,

      expiresIn: 3600,
    });
  } catch (err) {
    console.error(
      "POST /chapters/upload-link error:",
      err
    );

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

app.post("/admin/add-comment", async (req, res) => {
  try {
    // 👉 verify admin nếu cần
    // const admin = await verifyToken(req, true);
    // if (!admin) {
    //   return res.status(401).json({
    //     message: "Unauthorized!",
    //   });
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

    /* ================= VALIDATE ================= */
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
      // 👉 auto tạo seed user nếu chưa tồn tại
      await seedUsersCol.findOneAndUpdate(
        { username: finalUsername },
        {
          $setOnInsert: {
            username: finalUsername,
            avatarUrl: finalAvatar,
          },
        },
        {
          upsert: true,
        }
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

app.get("/admin/ebook", async (req, res) => {
  try {
    const usersCol = await getCollectionCloud("users");

    // ✅ Lấy toàn bộ slug unique
    const uniqueEbookSlugs = await usersCol.distinct("epubs");
    return res.json({
      total: uniqueEbookSlugs.length,
      ebooks: uniqueEbookSlugs,
    });
  } catch (error) {
    console.error("GET /ebooks error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

app.get("/user-stat", async (req, res) => {
  try {
    /**
     * VN timezone = UTC+7
     * Lấy đúng:
     * hôm nay 00:00:00 -> 23:59:59 VN
     */

    const now = new Date();

    // cộng 7h để ra giờ VN
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    // mốc 00:00:00 VN -> đổi về UTC
    const startTime = Math.floor(
      Date.UTC(
        vnNow.getUTCFullYear(),
        vnNow.getUTCMonth(),
        vnNow.getUTCDate(),
        -7, // trừ lại 7h
        0,
        0
      ) / 1000
    );

    // mốc 23:59:59 VN -> đổi về UTC
    const endTime = Math.floor(
      Date.UTC(
        vnNow.getUTCFullYear(),
        vnNow.getUTCMonth(),
        vnNow.getUTCDate(),
        16, // 23 - 7
        59,
        59
      ) / 1000
    );

    const logGroup =
      "/aws/lambda/ChapterStack-GetChapterContentLambda82DAEB08-tYogbBSKRr4J";

    // ===== TOP USERS =====
    const topUserQuery = `
fields @message
| filter @message like "view:"
| parse @message "view:*.*|*" as slug, email, rest
| stats count() as requestCount by email
| sort requestCount desc
| limit 10
    `;

    // ===== PLATFORM =====
    const platformQuery = `
fields @message
| filter @message like "view:"
| parse @message "view:*.*|*|*" as slug, email, chapter, platform
| stats count() as requestCount by platform
| sort requestCount desc
    `;

    const [topUsers, platformStats] = await Promise.all([
      runLogQuery(
        logGroup,
        topUserQuery,
        startTime,
        endTime
      ),
      runLogQuery(
        logGroup,
        platformQuery,
        startTime,
        endTime
      ),
    ]);

    return res.json({
      timezone: "Asia/Ho_Chi_Minh",
      from: startTime,
      to: endTime,
      topUsers,
      platformStats,
    });
  } catch (err) {
    console.error("GET /user-stat error:", err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});


/**
 * Lấy range:
 * - 00:00 hôm qua (VN)
 * - 00:00 hôm nay (VN)
 * - 23:59:59 hôm nay (VN)
 * Convert sang UTC để query MongoDB
 */
function getYesterdayAndTodayRangeVN() {
  // Lấy ngày hiện tại dưới dạng YYYY-MM-DD theo múi giờ VN (Asia/Ho_Chi_Minh)
  const vnDateStr = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh'
  });

  // Tạo mốc 00:00:00 hôm nay tại VN và ép về UTC
  // JavaScript hiểu "+07:00" nên sẽ tự động trừ đi 7 tiếng để ra giờ UTC chuẩn cho DB
  const startTodayUTC = new Date(`${vnDateStr}T00:00:00+07:00`);

  // Tính mốc 00:00:00 hôm qua bằng cách trừ đi 1 ngày từ mốc hôm nay
  const startYesterdayUTC = new Date(startTodayUTC);
  startYesterdayUTC.setDate(startYesterdayUTC.getDate() - 1);

  // Tính mốc 23:59:59 hôm nay
  const endTodayUTC = new Date(startTodayUTC);
  endTodayUTC.setHours(23, 59, 59, 999);

  return {
    startYesterdayUTC,
    startTodayUTC,
    endTodayUTC,
  };
}

app.get("/admin/top-book", async (req, res) => {
  try {
    const booksCol = await getCollectionCloud(BOOKS);
    const usersCol = await getCollectionCloud("users");

    // 1. Lấy range thời gian đã fix
    const {
      startYesterdayUTC,
      startTodayUTC,
      endTodayUTC,
    } = getYesterdayAndTodayRangeVN();

    // 2. Thực hiện query song song
    const [
      topViews,
      newUsersYesterday,
      newUsersToday,
      totalMembershipUsers,
      totalBooks,
    ] = await Promise.all([
      // TOP VIEW
      booksCol
        .find({}, {
          projection: { title: 1, slug: 1, weekViews: 1, thumbnailUrl: 1 },
        })
        .sort({ weekViews: -1 })
        .limit(20)
        .toArray(),

      // USER HÔM QUA: >= 00:00:00 hôm qua và < 00:00:00 hôm nay
      usersCol.countDocuments({
        createdAt: {
          $gte: startYesterdayUTC,
          $lt: startTodayUTC,
        },
      }),

      // USER HÔM NAY: >= 00:00:00 hôm nay và <= 23:59:59 hôm nay
      usersCol.countDocuments({
        createdAt: {
          $gte: startTodayUTC,
          $lte: endTodayUTC,
        },
      }),

      // MEMBERSHIP ACTIVE (Dựa trên thời điểm thực tế hiện tại)
      usersCol.countDocuments({
        premiumUntil: {
          $ne: null,
          $gt: new Date(),
        },
      }),

      // TOTAL BOOKS
      booksCol.estimatedDocumentCount(),
    ]);

    // 3. Trả kết quả
    return res.json({
      topViews,
      countUsers: {
        newYesterday: newUsersYesterday,
        newToday: newUsersToday,
        totalNew: newUsersYesterday + newUsersToday,
        totalMembershipUsers,
      },
      totalBooks,
      // Debug ranges để bạn check lại trên Compass nếu cần
      debugRanges: {
        vnDateStr: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }),
        startYesterdayUTC,
        startTodayUTC,
        endTodayUTC,
      },
    });
  } catch (error) {
    console.error("GET /admin/top-book error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

app.post("/r2/sign", async (req, res) => {
  const { key, contentType, isPublic } = req.body;

  const command = new PutObjectCommand({
    Bucket: isPublic ? "ngoc-tieu-cac-public" : "ngoc-tieu-cac",
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2, command, { expiresIn: 60 });

  res.json({ url });
});

app.get("/admin/token", async (req, res) => {
  return res.status(200).json({
    accessKeyId: S3_PUBLIC_KEY_ID,
    secretAccessKey: S3_PRIVATE_KEY_ID,
  });
})


app.post("/admin/comments/:bookSlug/seed", async (req, res) => {
  try {
    /* ----------------------------- Auth admin ----------------------------- */
    // const admin = await verifyToken(req, true);
    // if (!admin) {
    //   return res.status(401).json({
    //     message: "Unauthorized!",
    //   });
    // }

    /* --------------------------- Parse params --------------------------- */
    const { bookSlug } = req.params;

    const seed =
      req.query.seed === "true";

    if (!bookSlug) {
      return res.status(400).json({
        message: "Missing bookSlug",
      });
    }

    /* --------------------------- DB connect --------------------------- */
    const booksCol = await getCollectionCloud(BOOKS);

    /* ---------------------- Update seedComment flag ---------------------- */
    const result = await booksCol.updateOne(
      { slug: bookSlug },
      {
        $set: {
          isSeed: seed,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.json({
      bookSlug,
      seedEnabled: seed,
      message: seed
        ? "Seed comment enabled"
        : "Seed comment disabled",
    });
  } catch (err) {
    console.error("POST /admin/books/:bookSlug/seed error:", err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});


app.get("/trendings/:type", async (req, res) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({
        message: "Missing path parameter: type",
      });
    }

    const trendingsCol = await getCollectionCloud("trendings");

    // 👉 lấy document trending theo type
    const trending = await trendingsCol.findOne({ type });

    if (!trending) {
      return res.status(404).json({
        message: "Trending not found",
      });
    }

    return res.json(trending);
  } catch (err) {
    console.error("GET /trendings/:type error:", err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

app.delete("/remove-payment-requests", async (req, res) => {
  try {
    // 👉 nếu có auth admin thì verify ở đây
    // const admin = await verifyToken(req, true);
    // if (!admin) {
    //   return res.status(401).json({
    //     message: "Unauthorized",
    //   });
    // }

    const paymentCol = await getCollectionCloud(PAYMENT_REQUESTS);

    // 🗑️ delete toàn bộ records
    const result = await paymentCol.deleteMany({});

    return res.json({
      message: "All payment requests removed successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error(
      "DELETE /remove-payment-requests error:",
      err
    );

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});


app.post("/reset-week-views", async (req, res) => {
  try {
    // 👉 nếu có auth admin thì verify ở đây
    // const admin = await verifyToken(req, true);
    // if (!admin) {
    //   return res.status(401).json({
    //     message: "Unauthorized",
    //   });
    // }

    const booksCol = await getCollectionCloud(BOOKS);

    // 🔄 reset toàn bộ weekViews = 0
    const result = await booksCol.updateMany(
      {},
      {
        $set: {
          weekViews: 0,
          updatedAt: new Date(),
        },
      }
    );

    return res.json({
      message: "Reset weekViews thành công",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("POST /reset-weekviews error:", err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});


app.post("/admin/books/:bookSlug/toggle-seed", async (req, res) => {
  try {
    /* ----------------------------- Auth admin ----------------------------- */
    // const admin = await verifyToken(req, true);
    // if (!admin) {
    //   return res.status(401).json({
    //     message: "Unauthorized!",
    //   });
    // }

    /* --------------------------- Parse params --------------------------- */
    const { bookSlug } = req.params;

    const seed =
      req.query.seed === "true";

    if (!bookSlug) {
      return res.status(400).json({
        message: "Missing bookSlug",
      });
    }

    /* --------------------------- DB connect --------------------------- */
    const booksCol = await getCollectionCloud(BOOKS);

    /* ---------------------- Update seed flag ---------------------- */
    const result = await booksCol.updateOne(
      { slug: bookSlug },
      {
        $set: {
          isSeed: seed,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.json({
      bookSlug,
      seedEnabled: seed,
      message: seed
        ? "Seed enabled"
        : "Seed disabled",
    });
  } catch (err) {
    console.error(
      "POST /admin/books/:bookSlug/toggle-seed error:",
      err
    );

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});



app.delete("/delete-s3/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        message: "Missing slug",
      });
    }

    // 👉 nếu cần auth admin thì bật lại
    // const admin = await verifyToken(req, true);
    // if (!admin) {
    //   return res.status(401).json({
    //     message: "Unauthorized",
    //   });
    // }

    /**
     * PRIVATE_BUCKET
     * delete folder:
     * - slug/
     */
    await deleteByPrefix(
      PRIVATE_BUCKET,
      `${slug}/`
    );

    /**
     * PUBLIC_BUCKET
     * delete folders:
     * - free/slug/
     * - preview/slug/
     */
    await Promise.all([
      deleteByPrefix(
        PUBLIC_BUCKET,
        `free/${slug}/`
      ),

      deleteByPrefix(
        PUBLIC_BUCKET,
        `preview/${slug}/`
      ),
    ]);

    return res.json({
      success: true,
      message: "S3 cleaned successfully",
      deleted: {
        private: `${slug}/`,
        public: [
          `free/${slug}/`,
          `preview/${slug}/`,
        ],
      },
    });
  } catch (err) {
    console.error(
      "DELETE /delete-s3/:slug error:",
      err
    );

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

app.post("/books/:slug/banner-upload-link", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        message: "Missing slug",
      });
    }

    const defaultKey = `book-cover/${slug}/banner.webp`;
    const smallKey = `book-cover/${slug}/banner-small.webp`;

    // ✅ signed url upload banner lớn
    const defaultCommand = new PutObjectCommand({
      Bucket: publicR2Bucket,
      Key: defaultKey,
      ContentType: "image/webp",
    });

    // ✅ signed url upload banner nhỏ
    const smallCommand = new PutObjectCommand({
      Bucket: publicR2Bucket,
      Key: smallKey,
      ContentType: "image/webp",
    });

    const [defaultUrl, smallUrl] = await Promise.all([
      getSignedUrl(r2, defaultCommand, {
        expiresIn: 60,
      }),

      getSignedUrl(r2, smallCommand, {
        expiresIn: 60,
      }),
    ]);

    return res.json({
      storage: "r2",

      defaultUrl,
      smallUrl,

      defaultKey,
      smallKey,

      // optional
      bannerUrl: `${process.env.R2_PUBLIC_URL}/${defaultKey}`,
      bannerSmallUrl: `${process.env.R2_PUBLIC_URL}/${smallKey}`,
    });
  } catch (err) {
    console.error(
      "POST /books/:slug/banner-upload-link error:",
      err
    );

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

const CONFIGS = "config";

/* =========================
   GET AUTO APPROVE CONFIG
========================= */
app.get("/config/auto-approve-payment-request", async (req, res) => {
  try {
    const configCol = await getCollectionCloud(CONFIGS);

    const config = await configCol.findOne(
      { _id: "app_config" },
      {
        projection: {
          _id: 0,
          autoApprovePaymentRequest: 1,
        },
      }
    );

    return res.json({
      autoApprovePaymentRequest:
        config?.autoApprovePaymentRequest ?? false,
    });
  } catch (err) {
    console.error(
      "GET /config/auto-approve-payment-request error:",
      err
    );

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

/* =========================
   SET AUTO APPROVE CONFIG
========================= */
app.post("/config/auto-approve-payment-request", async (req, res) => {
  try {
    const { autoApprovePaymentRequest } = req.body;

    if (typeof autoApprovePaymentRequest !== "boolean") {
      return res.status(400).json({
        message:
          "autoApprovePaymentRequest must be boolean",
      });
    }

    const configCol = await getCollectionCloud(CONFIGS);

    await configCol.updateOne(
      { _id: "app_config" },
      {
        $set: {
          autoApprovePaymentRequest,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    );

    return res.json({
      message: "Update success",
      autoApprovePaymentRequest,
    });
  } catch (err) {
    console.error(
      "POST /config/auto-approve-payment-request error:",
      err
    );

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