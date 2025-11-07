"use client";

import { useState, useEffect } from "react";
import BackToHomeButton from "../components/BackToHomeButton";
import { fetchAllBookSlugs } from "../../apis/books";
import LeaderBoardEdit from "../components/LeaderBoard/LeaderBoardEdit";

type Book = { slug: string; title: string };

export default function LeaderBoard() {
  const [books, setBooks] = useState<Book[]>([]);

  // fetch slugs và leaderboard
  useEffect(() => {
    fetchAllBookSlugs((data: Book[]) => setBooks(data));
  }, []);

  return (
    <div className="container mx-auto pt-8">
      <BackToHomeButton />
      <LeaderBoardEdit books={books} type="top_love" title="Truyện Yêu Thích" />

      <LeaderBoardEdit books={books} type="trending_now" title="Truyện Xu hướng" />
      <LeaderBoardEdit books={books} type="recommended" title="Truyện Đề Cử" />
    </div>
  );
  
}
