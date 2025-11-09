"use client";

import { useState, useEffect, useRef } from "react";
import ContentEditableSection from "../components/ContentEditable/ContentEditable";
import Switch from "react-switch";
import {
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import {
  fetchChapterDetail,
  saveChapterContent,
  setChapterQuality,
} from "../../apis/chapters";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GeminiPrompt from "../components/Prompt/GeminiPrompt";
import { useNavigate, useParams } from "react-router-dom";

export default function ChapterDetailPage() {
  const params = useParams<{ slug: string; chapterNumber?: string }>();
  const slug = params.slug || "";
  const chapterNumber = params.chapterNumber
    ? parseInt(params.chapterNumber, 10)
    : 1;

  const navigate = useNavigate();

  const [chapterContent, setChapterContent] = useState<string>("");
  const contentRef = useRef<string>("");
  const [showGeminiPopover, setShowGeminiPopover] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isOn, setIsOn] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  const handeSetQuality = () => {
    console.log(isOn, "hahah");
    if (isOn === false) {
      setChapterQuality(slug, chapterNumber);
      toast.success("💾Chapter đã đủ quality!", {
        position: "bottom-right",
        autoClose: 2000,
        theme: "dark",
      });
      setIsOn(true);
    }
  };

  useEffect(() => {
    if (!slug) return;
    fetchChapterDetail(slug, chapterNumber, setChapterContent, setIsOn);
  }, [slug, chapterNumber]);

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
      await saveChapterContent(slug, chapterNumber, newContent);
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
      {/* 🧭 Header */}
      <div
        className={`fixed top-0 left-0 w-full z-40 border-b transition-all duration-200 ${
          scrolled
            ? "border-zinc-700 bg-zinc-900/90 shadow-lg"
            : "border-transparent bg-zinc-900/80"
        }`}
      >
        <div className="relative container mx-auto px-6 py-3 flex items-center justify-between">
          {/* ⬅️ Trái: Trở về + Checkbox */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trở về</span>
            </button>

            <div className="flex items-center gap-2 ml-6">
              <h2 className="font-bold">Đạt chuẩn:</h2>
              <Switch
                onChange={() => {
                  handeSetQuality();
                }}
                checked={isOn}
              />
            </div>
          </div>

          {/* 💾 Giữa: Nút Lưu chương */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <button
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"
              onClick={() => handleSave(chapterContent)}
            >
              Lưu chương
            </button>
          </div>

          {/* ✨ Phải: Nút Gợi ý */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setShowGeminiPopover((p) => !p)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition shadow-md"
              title="Nhận gợi ý từ Gemini"
            >
              <Sparkles className="w-4 h-4" />
              Gợi ý
            </button>

            {/* Popover nhỏ */}
            <div
              className={`absolute right-0 mt-2 bg-zinc-800 text-sm rounded-xl shadow-lg border border-zinc-700 transition-all duration-200 origin-top-right ${
                showGeminiPopover
                  ? "scale-100 opacity-100"
                  : "scale-90 opacity-0 pointer-events-none"
              }`}
              style={{ width: "320px", zIndex: 50 }}
            >
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-200 text-sm">
                    ✨ Gemini Gợi ý
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
      </div>

      {/* ⚙️ Nội dung */}
      <div className="container mx-auto pt-16 px-6 pb-16">
        {/* Điều hướng chương */}
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

        <div className="relative mt-4">
          <ContentEditableSection
            defaultContent={chapterContent}
            onSave={handleSave}
          />
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
