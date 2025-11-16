"use client";

import { useState, useEffect } from "react";
import ContentEditableSection from "../components/ContentEditable/ContentEditable";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  BookAlert,
  BookCheck,
} from "lucide-react";
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

  const [chapterContent, setChapterContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isQualified, setIsQualified] = useState(false);

  const handleSetQuality = async () => {
    await setChapterQuality(slug, chapterNumber, !isQualified);
    setIsQualified(!isQualified);
    toast.success("Đã lưu chapter quality!", {
      position: "bottom-right",
      autoClose: 2000,
      theme: "dark",
    });
  };

  // Load chapter
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const loadChapter = async () => {
      await fetchChapterDetail(
        slug,
        chapterNumber,
        (content) => {
          setChapterContent(content);
        },
        setIsQualified
      );
      setLoading(false);
    };
    loadChapter();
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

  const handleSave = async () => {
    try {
      await saveChapterContent(slug, chapterNumber, chapterContent || "");
      toast.success(`💾 Đã lưu chương thành công!`, {
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
          </div>
          <div className="flex justify-center gap-1">
            <button
              onClick={() => goToChapter(chapterNumber - 1)}
              disabled={chapterNumber <= 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition cursor-pointer ${
                chapterNumber > 1
                  ? "bg-zinc-800 hover:bg-zinc-700 text-gray-200"
                  : "bg-zinc-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => goToChapter(chapterNumber + 1)}
              className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg text-base font-medium transition bg-zinc-800 hover:bg-zinc-700 text-gray-200"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <div
              className="flex items-center gap-2 ml-6"
              onClick={() => handleSetQuality()}
            >
              {isQualified ? (
                <BookCheck className="w-7 h-7 text-emerald-400 cursor-pointer" />
              ) : (
                <BookAlert className="w-7 h-7 text-amber-500 cursor-pointer" />
              )}
            </div>
            <button
              onClick={handleSave}
              className="text-white hover:text-gray-200 cursor-pointer rounded-lg text-sm font-medium transition shadow-md"
            >
              <Save className="w-7 h-7" />
            </button>
          </div>

          {/* Lưu chương */}
        </div>
      </div>

      {/* Nội dung */}
      <div className="container mx-auto pt-16 px-6 pb-16 space-y-12">
        {/* Điều hướng */}

        {/* Render chapter */}
        <div className="relative border-t border-zinc-700 pt-6">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-zinc-700 rounded w-3/4"></div>
              <div className="h-6 bg-zinc-700 rounded w-full"></div>
              <div className="h-6 bg-zinc-700 rounded w-5/6"></div>
              <div className="h-6 bg-zinc-700 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-700 rounded w-full"></div>
            </div>
          ) : (
            <ContentEditableSection
              defaultContent={chapterContent}
              onChange={setChapterContent}
            />
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
