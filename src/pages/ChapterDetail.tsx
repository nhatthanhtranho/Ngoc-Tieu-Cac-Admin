"use client";

import { useState, useEffect, useRef } from "react";
import ContentEditableSection from "../components/ContentEditable/ContentEditable";
import {
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { fetchChapterDetail, saveChaptercontent } from "../../apis/chapters";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GeminiPrompt from "../components/Prompt/GeminiPrompt";
import { useNavigate, useParams } from "react-router-dom";

export default function ChapterDetailPage() {
  const params = useParams<{ slug: string; chapterNumber?: string }>();
  const slug = params.slug || "";

  // chapterNumber từ params là string, parse sang number
  const chapterNumber = params.chapterNumber
    ? parseInt(params.chapterNumber, 10)
    : 1; // default 1 nếu undefined hoặc không parse được

  const navigate = useNavigate();

  const [chapterContent, setChapterContent] = useState<string>("");
  const contentRef = useRef<string>("");
  const [showGeminiPopover, setShowGeminiPopover] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    fetchChapterDetail(slug, chapterNumber, setChapterContent);
  }, [slug, chapterNumber]);

  // Click ra ngoài để đóng popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowGeminiPopover(false);
      }
    };
    if (showGeminiPopover)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGeminiPopover]);

  // Theo dõi scroll để tạo hiệu ứng shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToChapter = (newNumber: number) => {
    if (newNumber < 1) return;
    navigate(`/book/${slug}/chapter/${newNumber}`);
  };

  const handleSave = async (newContent: string) => {
    contentRef.current = newContent;
    try {
      await saveChaptercontent(slug, chapterNumber, newContent);
      toast.success("💾 Đã lưu chương thành công!", {
        position: "bottom-right",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (err) {
      console.error(err);
      toast.error("❌ Lưu thất bại, vui lòng thử lại!", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100">
      {/* 🧭 Header cố định */}
      <div
        className={`fixed top-0 left-0 w-full z-40 backdrop-blur-md border-b transition-all duration-200 ${
          scrolled
            ? "border-zinc-700 bg-zinc-900/90 shadow-lg"
            : "border-transparent bg-zinc-900/80"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trở về</span>
          </button>

          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            onClick={() => handleSave(chapterContent)}
          >
            💾 Lưu chương
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => goToChapter(chapterNumber - 1)}
              disabled={chapterNumber <= 1}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                chapterNumber > 1
                  ? "bg-zinc-800 hover:bg-zinc-700 text-gray-200"
                  : "bg-zinc-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ArrowLeftCircle className="w-4 h-4" />
              Trước
            </button>

            <div className="text-sm text-gray-400 select-none">
              Chương <span className="text-gray-100">{chapterNumber}</span>
            </div>

            <button
              onClick={() => goToChapter(chapterNumber + 1)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition bg-zinc-800 hover:bg-zinc-700 text-gray-200"
            >
              Sau
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ⚙️ Thêm padding top để tránh header che nội dung */}
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Editor */}
        <div className="relative">
          <ContentEditableSection
            defaultContent={chapterContent}
            onSave={handleSave}
          />

          {/* ✨ Gemini Icon + popover nhỏ */}
          <div className="absolute top-3 right-3" ref={popoverRef}>
            <button
              onClick={() => setShowGeminiPopover((p) => !p)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-md transition"
              title="Nhận gợi ý từ Gemini"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* Popover nhỏ */}
            <div
              className={`absolute top-0 right-12 bg-zinc-800 text-sm rounded-xl shadow-lg border border-zinc-700 transition-all duration-200 origin-right ${
                showGeminiPopover
                  ? "scale-100 opacity-100"
                  : "scale-90 opacity-0 pointer-events-none"
              }`}
              style={{ width: "300px", zIndex: 50 }}
            >
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-200 text-sm">
                    Gemini Gợi ý
                  </span>
                  <button
                    onClick={() => setShowGeminiPopover(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <GeminiPrompt
                  content={chapterContent}
                  onResponse={(res) => {
                    setChapterContent(res);
                    setShowGeminiPopover(false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-center gap-6 mt-12 border-t border-zinc-700 pt-6">
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
      </div>

      <ToastContainer />
    </div>
  );
}
