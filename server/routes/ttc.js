import { Router } from "express";
import { getCollection } from "../db.js";
import { Buffer } from "buffer";

export const ttcRouter = Router();

ttcRouter.get("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bookCol = await getCollection("tiem-truyen-chu");

    const book = await bookCol.findOne(
      { id: Number(id) || id },
    );

    if (!book) {
      return res.status(404).json({
        error: "Book not found",
      });
    }

    return res.json(book);
  } catch (err) {
    console.error("GET tiem-truyen-chu book error:", err);

    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
});

ttcRouter.get("/books", async (req, res) => {
  try {
    const bookCol = await getCollection("tiem-truyen-chu");

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "100", 10), 1),
      500
    );

    const search = (req.query.search || "").trim();

    const filter = {};

    if (search) {
      filter.$or = [
        {
          slug: {
            $regex: search,
            $options: "i",
          },
        },
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const total = await bookCol.countDocuments(filter);

    const books = await bookCol
      .find(filter)
      .project({
        _id: 1,
        id: 1,
        title: 1,
        slug: 1,
        cover_url: 1,
        total_chapters: 1,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return res.json({
      books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET tiem-truyen-chu books error:", err);

    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
});

ttcRouter.get("/image", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "url is required",
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch image",
      });
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";

    res.setHeader("Content-Type", contentType);

    // cache 30 ngày
    res.setHeader(
      "Cache-Control",
      "public, max-age=2592000, immutable"
    );

    const buffer = Buffer.from(await response.arrayBuffer());

    return res.send(buffer);
  } catch (err) {
    console.error("Proxy image error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
});