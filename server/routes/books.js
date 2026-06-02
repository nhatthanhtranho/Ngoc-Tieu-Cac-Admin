import { Router } from 'express'
import { getCollectionCloud } from "../db.js";
import { generateHomePage } from '../home.mjs';

export const bookRouter = Router();
const BOOKS = "books";

bookRouter.get("/slugs", async (req, res) => {
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

bookRouter.post("/slugs", async (req, res) => {
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

bookRouter.get("/generate", async (req, res) => {
    try {

        const booksCol = await getCollectionCloud(BOOKS);

        await generateHomePage(booksCol)

        return res.json({ message: "Done" }); // ✅ QUAN TRỌNG
    } catch (err) {
        console.error("GET /slugs error:", err);
        return res.status(500).json({ error: err.message });
    }
});

