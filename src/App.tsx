import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BookDetail from "./pages/BookDetail";
import ChapterDetailPage from "./pages/ChapterDetail";
import LeaderBoard from "./pages/LeaderBoard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<LeaderBoard />} />

      <Route path="/book/:slug" element={<BookDetail />} />
      <Route
        path="/book/:slug/chapter/:chapterNumber"
        element={<ChapterDetailPage />}
      />
    </Routes>
  );
}
