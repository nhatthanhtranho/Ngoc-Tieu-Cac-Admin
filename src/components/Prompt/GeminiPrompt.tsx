"use client";

import { useState } from "react";
import { toast } from "react-toastify";

function generatePrompt(content: string) {
  return `
Bạn là một biên tập viên dịch thuật chuyên nghiệp. 
Nhiệm vụ của bạn là **cải thiện bản dịch tiếng Việt** bên dưới để câu chữ tự nhiên, trôi chảy và đúng ngữ cảnh hơn — 
nhưng **phải giữ nguyên định dạng, bố cục, xuống dòng và ký tự đặc biệt** của chương truyện gốc.

⚠️ Yêu cầu:
- Không thêm ghi chú, tiêu đề, hay lời giải thích.
- Không thay đổi cấu trúc format (xuống dòng, dấu cách, v.v.).
- Chỉ trả về phần nội dung chương truyện đã được chỉnh sửa.
- Không dịch tên riêng của nhân vật
Nội dung chương:
${content}
`;
}

interface GeminiPromptProps {
  content: string;
  onResponse?: (response: string) => void;
}

export default function GeminiPrompt({
  content = "",
  onResponse,
}: GeminiPromptProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const apiKey = "";

  const handleSendPrompt = async () => {
    // ✅ Không chặn khi prompt trống — vì đã có default prompt
    const finalPrompt = prompt.trim() || generatePrompt(content);

    setLoading(true);

    try {
      const model = "models/gemini-2.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: finalPrompt }] }],
          }),
        }
      );

      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

      const data = await res.json();
      const geminiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "Không nhận được phản hồi hợp lệ từ Gemini.";

      onResponse?.(geminiText);

      toast.success("💡 Đã nhận gợi ý từ Gemini!", {
        position: "bottom-right",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (err) {
      console.error("Gemini error:", err);
      toast.error("⚠️ Lỗi khi gửi tới Gemini!", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <textarea
        rows={4}
        placeholder=""
        className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none w-full"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={handleSendPrompt}
        disabled={loading}
        className={`flex items-center justify-center gap-2 px-5 py-3 mt-4 rounded-xl text-sm font-medium transition ml-auto ${
          loading
            ? "bg-zinc-700 text-gray-500 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
        }`}
      >
        {loading ? (
          <span className="animate-pulse">Đang gửi...</span>
        ) : (
          "Gửi Prompt"
        )}
      </button>
    </div>
  );
}
