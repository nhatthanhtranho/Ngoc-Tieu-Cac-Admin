import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BookDetail from "./pages/BookDetail";
import ChapterDetailPage from "./pages/ChapterDetail";
import LeaderBoard from "./pages/LeaderBoard";
import CreateBook from "./pages/CreateBook";
import NapTienNgoc from "./pages/NapTienNgoc";
import TopUp from "./pages/TopUp";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<LeaderBoard />} />
      <Route path="/nap-tien-ngoc" element={<NapTienNgoc />} />
      <Route path="/top-up" element={<TopUp />} />
      <Route path="/create-book" element={<CreateBook />} />
      <Route path="/book/:slug" element={<BookDetail />} />
      <Route
        path="/book/:slug/chapter/:chapterNumber"
        element={<ChapterDetailPage />}
      />
    </Routes>
  );
}
