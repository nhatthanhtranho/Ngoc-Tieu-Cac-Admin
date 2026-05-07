import { getBooksBySlugs } from "./books";
import { brotliCompressSync, constants } from "zlib";

export async function uploadHomePageData(jsonString) {
  const s3 = getS3Client();

  try {
    const compressed = brotliCompressSync(
      Buffer.from(jsonString),
      {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: 11,
        },
      }
    );

    await s3.send(
      new PutObjectCommand({
        Bucket: "assets.itruyenchu.com",
        Key: "home-page.json",
        Body: compressed,
        ContentType: "application/json",
        ContentEncoding: "br",
        CacheControl: "public, immutable",
      })
    );

    return true;
  } catch (error) {
    console.error("Upload homepage data failed:", error);
    return false;
  }
}

function truncateText(text, maxLength = 100) {
  if (!text) return text;
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export async function generateHomePage(trendingsCol, booksCol, commentsCol) {
  const recommendedBookSlugs = await booksCol
    .find()
    .sort({ monthlyMoonTicket: -1 })
    .limit(20)
    .project({
      slug: 1,
    })
    .toArray();

  const topViewBookSlugs = await booksCol
    .find()
    .sort({ weekViews: -1 })
    .limit(20)
    .project({
      slug: 1,
    })
    .toArray();

  const topTienNgocBookSlugs = await booksCol
    .find()
    .sort({ totalTienNgoc: -1 })
    .limit(20)
    .project({
      slug: 1,
    })
    .toArray();

  const trendings = await trendingsCol
    .find({})
    .project({ type: 1, books: 1 })
    .toArray();

  const tops = trendings.reduce((acc, t) => {
    acc[t.type] = t.books || [];
    return acc;
  }, {});

  tops.top_view = topViewBookSlugs.map((b) => b.slug);
  tops.recommend = recommendedBookSlugs.map((b) => b.slug);
  tops.top_tien_ngoc = topTienNgocBookSlugs.map((b) => b.slug);

  const relatedBookSlugs = [...new Set(Object.values(tops).flat())];

  let relatedBooks = await getBooksBySlugs(booksCol, relatedBookSlugs);

  relatedBooks = relatedBooks.map((book) => {
    const isLatest = (tops["latest"] || []).includes(book.slug);
    const isBanner = (tops["banners"] || []).includes(book.slug);
    return {
      slug: book.slug,
      title: book.title,
      currentChapter: book.currentChapter,
      description:
        isBanner || isLatest ? truncateText(book.description, 800) : undefined,
      categories: isBanner || isLatest ? book.categories : undefined,
      isFull: book.categories?.includes("hoan-thanh") ?? false,
      totalViews: isBanner ? book.totalViews : undefined,
    };
  });

  const comments = await commentsCol.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$slug",
        latestComment: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$latestComment" } },
    { $sort: { createdAt: -1 } },
    { $limit: 30 },
    {
      $project: {
        _id: 0,
        slug: 1,
        username: 1,
        content: 1,
        createdAt: 1,
        type: 1,
        converter: 1,
      },
    },
  ]);

  const commentBookSlugs = Array.from(new Set(comments.map((c) => c.slug)));

  const commentBooks = await getBooksBySlugs(booksCol, commentBookSlugs);

  const bookMap = new Map(commentBooks.map((b) => [b.slug, b]));

  const homeComments = comments.map((c) => {
    const book = bookMap.get(c.slug);
    return {
      slug: c.slug,
      title: book?.title,
      tacGia: book?.tacGia,
      content: c.content,
      username: c.username,
      createdAt: c.createdAt,
      currentChapter: book?.currentChapter,
      type: c.type,
      converter: c.converter,
      avatarUrl: c.avatarUrl,
    };
  });

  const homeJson = JSON.stringify({
    tops,
    books: relatedBooks,
    latestComments: homeComments,
  });
}
