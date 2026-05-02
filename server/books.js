const LIMIT = 25

export async function getRelatedBooks(bookCol, book) {
    // 1️⃣ Sách cùng tác giả
    const sameAuthorBooks = await bookCol
      .find({
        tacGia: book.tacGia,
        slug: { $ne: book.slug }, // không lấy chính nó
      })
      .limit(LIMIT)
      .project({
        _id: 0,
        title: 1,
        tacGia: 1,
        slug: 1,
        categories: 1,
      })
      .toArray();
  
    let relatedBooks = [...sameAuthorBooks];
  
    // 2️⃣ Nếu chưa đủ thì bù bằng sách cùng category
    if (relatedBooks.length < LIMIT) {
      const remain = LIMIT - relatedBooks.length;
  
      const sameCategoryBooks = await bookCol
        .aggregate([
          {
            $match: {
              categories: { $in: book.categories }, // chỉ cần trùng 1 category
              tacGia: { $ne: book.tacGia }, // tránh trùng tác giả
              slug: { $ne: book.slug }, // tránh trùng chính nó
            },
          },
          { $sample: { size: remain } }, // random
          {
            $project: {
              title: 1,
              tacGia: 1,
              slug: 1,
              categories: 1,
            },
          },
        ])
        .toArray();
  
      relatedBooks = relatedBooks.concat(sameCategoryBooks);
    }
  
    return relatedBooks;
  }