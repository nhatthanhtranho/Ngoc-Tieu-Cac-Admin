/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from "react";
import Step1Form from "./Step1";
import StepIndicator from "./StepIndicator";
import { useRouter } from "next/navigation";
import pako from "pako";

export interface StoryFormData {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  dichGia: string;
  tacGia: string;
  tagInput: string;
  bannerImage?: { medium: string; small: string; default: string };
}

export default function CreateStoryForm() {
  const router = useRouter();
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    description: "",
    slug: "",
    tags: [],
    dichGia: "",
    tagInput: "",
    bannerImage: { medium: "", small: "", default: "" },
    tacGia: "",
  });

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      tagInput: value,
      tags: value.split(",").map((tag) => tag.trim()).filter((tag) => tag !== ""),
    }));
  };

  const handleCheckSlug = async () => {
    if (!formData.slug) return alert("⚠️ Vui lòng nhập slug!");
    try {
      const res = await fetch(`http://localhost:3002/books/check-slug/${formData.slug}`);
      const data = await res.json();
      if (data.exists) {
        setSlugAvailable(false);
        alert("❌ Slug đã tồn tại!");
      } else {
        setSlugAvailable(true);
        alert("✅ Slug hợp lệ!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi kiểm tra slug");
    }
  };

  const handleChangeBannerImage = (result: { small: string; medium: string; default: string }) => {
    setFormData((prev) => ({ ...prev, bannerImage: result }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề không được để trống.";
    if (!formData.description.trim()) newErrors.description = "Mô tả không được để trống.";
    if (!formData.slug.trim()) newErrors.slug = "Slug không được để trống.";
    if (slugAvailable !== true) newErrors.slugCheck = "Slug chưa được kiểm tra.";
    if (!formData.tacGia.trim()) newErrors.tacGia = "Nhập tên tác giả.";
    if (!formData.dichGia.trim()) newErrors.dichGia = "Nhập tên dịch giả.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return alert("⚠️ Kiểm tra lại thông tin!");

    try {
      const payload = { ...formData, status: "Published" };
      const compressed = pako.gzip(JSON.stringify(payload));
      const blob = new Blob([compressed], { type: "application/gzip" });
      const formDataToSend = new FormData();
      formDataToSend.append("file", blob, "book-info.json.gz");

      const res = await fetch("http://localhost:3002/books", {
        method: "POST",
        body: formDataToSend,
      });

      if (!res.ok) throw new Error();
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi lưu truyện");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div
        className="w-full max-w-4xl bg-white/90 dark:bg-gray-800/60 backdrop-blur-xl 
        border border-yellow-200 dark:border-sky-600/40 p-10 rounded-3xl 
        shadow-[0_0_25px_rgba(0,0,0,0.1)] space-y-10"
      >
        {/* --- Tiêu đề style Genshin --- */}
        <h2
          className="text-center text-4xl sm:text-5xl font-semibold 
          text-transparent bg-clip-text bg-gradient-to-r from-[#f5e6b2] via-[#a8d5ff] to-[#4ea8de]
          tracking-wider drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]
          font-[Cinzel]"
          style={{
            textShadow: "0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(173,216,255,0.3)",
          }}
        >
          ✨ Tạo Truyện Mới ✨
        </h2>

        <StepIndicator steps={[{ id: 1, label: "Thông tin" }]} currentStep={1} />

        <Step1Form
          handleChangeBannerImage={handleChangeBannerImage}
          formData={formData}
          onInfoChange={handleInfoChange}
          onTagsChange={handleTagInputChange}
          onCheckSlug={handleCheckSlug}
          slugAvailable={slugAvailable}
        />

        {/* ⚠️ Hiển thị lỗi */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-100/70 text-red-700 dark:bg-red-900/50 dark:text-red-200 p-3 rounded-lg shadow-sm">
            <ul className="list-disc list-inside">
              {Object.entries(errors).map(([k, v]) => (
                <li key={k}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Nút lưu */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 text-white font-semibold rounded-xl
            bg-gradient-to-r from-yellow-400 via-amber-500 to-sky-600 
            hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,200,0.5)] 
            transition-all duration-300"
          >
            ✅ Lưu Truyện
          </button>
        </div>
      </div>
    </div>
  );
}
