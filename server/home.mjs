import { PutObjectCommand } from "@aws-sdk/client-s3";
import { brotliCompressSync, constants } from "zlib";

import {
  BANNER_SLUGS,
  CATEGORIES,
  PUBLIC_BUCKET,
  r2,
} from "./constants.js";

import { getBooksBySlugs } from "./books.js";

import fs from "fs";
import path from "path";

async function uploadJsonFile(
  key,
  jsonString,
) {
  try {
    const compressed =
      brotliCompressSync(
        Buffer.from(jsonString),
        {
          params: {
            [constants.BROTLI_PARAM_QUALITY]:
              11,
          },
        },
      );

    await r2.send(
      new PutObjectCommand({
        Bucket: PUBLIC_BUCKET,
        Key: key,
        Body: compressed,
        ContentType:
          "application/json",
        ContentEncoding: "br",
        CacheControl:
          "public, immutable",
      }),
    );

    return true;
  } catch (error) {
    console.error(
      `Upload failed [${key}]`,
      error,
    );

    return false;
  }
}

function truncateText(
  text,
  maxLength = 100,
) {
  if (!text) return text;

  if (text.length <= maxLength) {
    return text;
  }

  return (
    text.slice(0, maxLength).trim() +
    "..."
  );
}

function mapBook(
  book,
  options = {},
) {
  const {
    full = false,
    showDescription = false,
    showCategories = false,
    showStats = false,
  } = options;

  return {
    slug: book.slug,
    title: book.title,
    poster: book.poster,
    author: book.author,
    currentChapter:
      book.currentChapter,

    description: showDescription
      ? truncateText(
          book.description,
          800,
        )
      : undefined,

    categories: showCategories
      ? book.categories
      : undefined,

    totalViews: showStats
      ? book.totalViews
      : undefined,

    monthlyMoonTicket:
      showStats
        ? book.monthlyMoonTicket
        : undefined,

    totalTienNgoc: showStats
      ? book.totalTienNgoc
      : undefined,

    isFull:
      book.categories?.includes(
        "hoan-thanh",
      ) ?? false,

    ...(full && {
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    }),
  };
}

async function generateCategoryFile(
  booksCol,
  category,
) {
  const categoryBookSlugs =
    await booksCol
      .find({
        categories: category,
      })
      .sort({
        weekViews: -1,
      })
      .limit(300)
      .project({
        slug: 1,
      })
      .toArray();

  const slugs =
    categoryBookSlugs.map(
      (b) => b.slug,
    );

  let books =
    await getBooksBySlugs(
      booksCol,
      slugs,
    );

  // chỉ lưu array books
  // s = slug
  // t = title
  // f = isFull
  // c = currentChapter

  books = books.map((book) => ({
    s: book.slug,
    t: book.title,

    f:
      book.categories?.includes(
        "hoan-thanh",
      ) ?? false,

    c:
      book.currentChapter || 0,
  }));

  const categoryJson =
    JSON.stringify(books);

  // local file
  const outputPath = path.join(
    process.cwd(),
    `${category}.json`,
  );

  fs.writeFileSync(
    outputPath,
    categoryJson,
    "utf8",
  );

  console.log(
    `Đã ghi file: ${outputPath}`,
  );

  // upload R2
  await uploadJsonFile(
    `${category}.json`,
    categoryJson,
  );
}

export async function generateHomePage(
  booksCol,
) {
  const recommendBookSlugs =
    await booksCol
      .find()
      .sort({
        monthlyMoonTicket: -1,
      })
      .limit(30)
      .project({
        slug: 1,
      })
      .toArray();

  const topViewBookSlugs =
    await booksCol
      .find()
      .sort({
        weekViews: -1,
      })
      .limit(20)
      .project({
        slug: 1,
      })
      .toArray();

  const completedBookSlugs =
    await booksCol
      .find({
        categories:
          "hoan-thanh",
      })
      .sort({
        createdAt: -1,
      })
      .limit(20)
      .project({
        slug: 1,
      })
      .toArray();

  const latestBookSlugs =
    await booksCol
      .find({
        slug: {
          $nin:
            completedBookSlugs.map(
              (b) => b.slug,
            ),
        },
      })
      .sort({
        createdAt: -1,
      })
      .limit(30)
      .project({
        slug: 1,
      })
      .toArray();

  const discoverBookSlugs =
    await booksCol
      .find({
        slug: {
          $nin: [
            ...completedBookSlugs.map(
              (b) => b.slug,
            ),

            ...latestBookSlugs.map(
              (b) => b.slug,
            ),
          ],
        },
      })
      .sort({
        createdAt: -1,
      })
      .limit(30)
      .project({
        slug: 1,
      })
      .toArray();

  const topTienNgocBookSlugs =
    await booksCol
      .find()
      .sort({
        totalTienNgoc: -1,
      })
      .limit(20)
      .project({
        slug: 1,
      })
      .toArray();

  const excludedSlugs =
    new Set([
      ...recommendBookSlugs.map(
        (b) => b.slug,
      ),

      ...topViewBookSlugs.map(
        (b) => b.slug,
      ),

      ...topTienNgocBookSlugs.map(
        (b) => b.slug,
      ),

      ...latestBookSlugs.map(
        (b) => b.slug,
      ),

      ...completedBookSlugs.map(
        (b) => b.slug,
      ),

      ...discoverBookSlugs.map(
        (b) => b.slug,
      ),
    ]);

  const categoryBooks = {};

  for (const category of CATEGORIES) {
    const books =
      await booksCol
        .aggregate([
          {
            $match: {
              categories:
                category,

              slug: {
                $nin: [
                  ...excludedSlugs,
                ],
              },
            },
          },

          {
            $sample: {
              size: 30,
            },
          },

          {
            $project: {
              slug: 1,
            },
          },
        ])
        .toArray();

    const uniqueSlugs = [];

    for (const book of books) {
      if (
        excludedSlugs.has(
          book.slug,
        )
      ) {
        continue;
      }

      excludedSlugs.add(
        book.slug,
      );

      uniqueSlugs.push(
        book.slug,
      );

      if (
        uniqueSlugs.length >= 30
      ) {
        break;
      }
    }

    categoryBooks[category] =
      uniqueSlugs;
  }

  const tops = {};

  tops.top_view =
    topViewBookSlugs.map(
      (b) => b.slug,
    );

  tops.recommend =
    recommendBookSlugs.map(
      (b) => b.slug,
    );

  tops.top_tien_ngoc =
    topTienNgocBookSlugs.map(
      (b) => b.slug,
    );

  tops.latest =
    latestBookSlugs.map(
      (b) => b.slug,
    );

  tops.banners =
    BANNER_SLUGS;

  tops.discover =
    discoverBookSlugs.map(
      (b) => b.slug,
    );

  tops["hoan-thanh"] =
    completedBookSlugs.map(
      (b) => b.slug,
    );

  for (const category of CATEGORIES) {
    tops[category] =
      categoryBooks[category];
  }

  const relatedBookSlugs = [
    ...new Set(
      Object.values(tops).flat(),
    ),
  ];

  let relatedBooks =
    await getBooksBySlugs(
      booksCol,
      relatedBookSlugs,
    );

  relatedBooks =
    relatedBooks.map((book) => {
      const isLatest =
        (
          tops.latest || []
        ).includes(book.slug);

      const isBanner =
        (
          tops.banners || []
        ).includes(book.slug);

      const isRecommend =
        (
          tops.recommend || []
        ).includes(book.slug);

      return mapBook(book, {
        showDescription:
          isBanner ||
          isLatest ||
          isRecommend,

        showCategories:
          isBanner ||
          isLatest ||
          isRecommend,

        showStats:
          isBanner ||
          isRecommend,
      });
    });

  const homeJson =
    JSON.stringify({
      tops,
      books: relatedBooks,
    });

  // local home-page.json
  const outputPath = path.join(
    process.cwd(),
    "home-page.json",
  );

  fs.writeFileSync(
    outputPath,
    homeJson,
    "utf8",
  );

  console.log(
    `Đã ghi file: ${outputPath}`,
  );

  // upload homepage
  await uploadJsonFile(
    "home-page.json",
    homeJson,
  );

  // generate category json
  await Promise.all(
    CATEGORIES.map(
      (category) =>
        generateCategoryFile(
          booksCol,
          category,
        ),
    ),
  );

  return {
    message:
      "Home page & category files generated successfully!",
  };
}