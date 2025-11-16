"use client";

import { useState, useEffect } from "react";
import ContentEditableSection from "../components/ContentEditable/ContentEditable";
import Switch from "react-switch";
import { ArrowLeft, ArrowLeftCircle, ArrowRight } from "lucide-react";
import {
  fetchChapterDetail,
  saveChapterContent,
  setChapterQuality,
} from "../../apis/chapters";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";

export default function ChapterDetailPage() {
  const params = useParams<{ slug: string; chapterNumber?: string }>();
  const slug = params.slug || "";
  const chapterNumber = params.chapterNumber
    ? parseInt(params.chapterNumber, 10)
    : 1;

  const navigate = useNavigate();

  const [chaptersContent, setChaptersContent] = useState<{
    [key: number]: string;
  }>({});
  const [scrolled, setScrolled] = useState(false);
  const [isOn, setIsOn] = useState(false);

  const handeSetQuality = () => {
    setChapterQuality(slug, chapterNumber, !isOn);
    setIsOn(!isOn);
    toast.success("Đã lưu chapter quality!", {
      position: "bottom-right",
      autoClose: 2000,
      theme: "dark",
    });
  };

  // Load current + next chapter
  useEffect(() => {
    if (!slug) return;
    const loadChapters = async () => {
      await fetchChapterDetail(
        slug,
        chapterNumber,
        (content) => {
          setChaptersContent((prev) => ({ ...prev, [chapterNumber]: content }));
        },
        setIsOn
      );

      await fetchChapterDetail(slug, chapterNumber + 1, (content) => {
        setChaptersContent((prev) => ({
          ...prev,
          [chapterNumber + 1]: content,
        }));
      });
    };
    loadChapters();
  }, [slug, chapterNumber]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToChapter = (newNumber: number) => {
    if (newNumber < 1) return;
    navigate(`/book/${slug}/chapter/${newNumber}`);
  };

  const handleSaveAll = async () => {
    try {
      await Promise.all(
        [chapterNumber, chapterNumber + 1].map((num) =>
          saveChapterContent(slug, num, chaptersContent[num] || "")
        )
      );
      toast.success(`💾 Đã lưu 2 chương thành công!`, {
        position: "bottom-right",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (err) {
      console.error(err);
      toast.error(`❌ Lưu thất bại, vui lòng thử lại!`, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100">
      {/* Header */}
      <div
        className={`fixed top-0 left-0 w-full z-40 border-b transition-all duration-200 ${
          scrolled
            ? "border-zinc-700 bg-zinc-900/90 shadow-lg"
            : "border-transparent bg-zinc-900/80"
        }`}
      >
        <div className="relative container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trở về</span>
            </button>

            <div className="flex items-center gap-2 ml-6">
              <Switch onChange={handeSetQuality} checked={isOn} />
            </div>
          </div>

          {/* Lưu 2 chương */}
          <button
            onClick={handleSaveAll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"
          >
            💾 Lưu cả 2 chương
          </button>
        </div>
      </div>

      {/* Nội dung */}
      <div className="container mx-auto pt-16 px-6 pb-16 space-y-12">
        {/* Điều hướng */}
        <div className="flex justify-center gap-6 pt-6">
          <button
            onClick={() => goToChapter(chapterNumber - 1)}
            disabled={chapterNumber <= 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition ${
              chapterNumber > 1
                ? "bg-zinc-800 hover:bg-zinc-700 text-gray-200"
                : "bg-zinc-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            <ArrowLeftCircle className="w-5 h-5" />
            Chương trước
          </button>

          <button
            onClick={() => goToChapter(chapterNumber + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition bg-zinc-800 hover:bg-zinc-700 text-gray-200"
          >
            Chương sau
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Render 2 chương */}
        {[chapterNumber, chapterNumber + 1].map((num) => (
          <div key={num} className="relative border-t border-zinc-700 pt-6">
            <h2 className="text-lg font-semibold mb-2">Chương {num}</h2>
            <ContentEditableSection
              defaultContent={chaptersContent[num] || ""}
              onChange={(val) =>
                setChaptersContent((prev) => ({ ...prev, [num]: val }))
              }
            />
          </div>
        ))}
      </div>

      <ToastContainer />
    </div>
  );
}
