import { PutObjectCommand } from "@aws-sdk/client-s3";
import { brotliCompressSync, constants } from "zlib";
import { PUBLIC_BUCKET, s3 } from "./constants.js";
import { getBooksBySlugs } from "./books.js";

export async function uploadHomePageData(jsonString) {
  try {
    const compressed = brotliCompressSync(Buffer.from(jsonString), {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
      },
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: PUBLIC_BUCKET,
        Key: "home-page.json",
        Body: compressed,
        ContentType: "application/json",
        ContentEncoding: "br",
        CacheControl: "public, immutable",
      }),
    );
    console.log("Generate new!")

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

export async function generateHomePage(trendingsCol, booksCol) {
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
    const isRecommend = (tops["recommend"] || []).includes(book.slug);
    return {
      slug: book.slug,
      title: book.title,
      currentChapter: book.currentChapter,
      description:
        isBanner || isLatest || isRecommend ? truncateText(book.description, 800) : undefined,
      categories: isBanner || isLatest || isRecommend? book.categories : undefined,
      isFull: book.categories?.includes("hoan-thanh") ?? false,
      totalViews: isBanner ? book.totalViews : undefined,
      monthlyMoonTicket: isRecommend ? book.monthlyMoonTicket : undefined,
    };
  });

  const homeJson = JSON.stringify({
    tops,
    books: relatedBooks,
  });

  await uploadHomePageData(homeJson);

  return {
    message: "Home page data generated and uploaded successfully!",
  };
}
