/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import slugify from "slugify";
import { checkBookSlugValid, createBook } from "../../../apis/books";

export interface StoryFormData {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  dichGia: string;
  tacGia: string;
  tagInput: string;
}

interface CreateStoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (book: any) => void;
}

/* =========================
        SLUG VN
========================= */
function slugVN(str: string) {
  if (!str) return "";
  return slugify(
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D"),
    { lower: true, strict: true, trim: true }
  );
}

export default function CreateStoryFormModal({
  isOpen,
  onClose,
  onCreate,
}: CreateStoryFormModalProps) {
  const navigate = useNavigate();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    description: "",
    slug: "",
    tags: [],
    dichGia: "",
    tacGia: "",
    tagInput: "",
  });

  /* =========================
        HANDLERS
  ========================= */

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: slugEdited ? prev.slug : slugVN(value),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      slug: slugVN(e.target.value),
    }));
    setSlugEdited(true);
    setSlugStatus("idle");
  };

  const handleInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      tagInput: value,
      tags: value.split(",").map((t) => t.trim()).filter(Boolean),
    }));
  };

  const handleValidate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Tiêu đề không được để trống.";
    if (!formData.slug.trim()) newErrors.slug = "Slug không được để trống.";
    if (!formData.tacGia.trim()) newErrors.tacGia = "Nhập tên tác giả.";
    if (!formData.dichGia.trim()) newErrors.dichGia = "Nhập tên dịch giả.";
    if (slugStatus === "taken")
      newErrors.slug = "Slug đã tồn tại.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!handleValidate()) return alert("⚠️ Kiểm tra lại thông tin!");

    try {
      const res = await createBook({
        ...formData,
        status: "Published",
        currentChapter: 0,
      } as any);

      onCreate?.(res);
      onClose();
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi lưu truyện");
    }
  };

  const handleCheckSlug = async () => {
    if (!formData.slug.trim()) return alert("Nhập slug trước!");

    try {
      setSlugStatus("checking");
      const ok = await checkBookSlugValid(formData.slug);
      setSlugStatus(ok ? "available" : "taken");
    } catch {
      setSlugStatus("idle");
      alert("❌ Lỗi check slug");
    }
  };

  if (!isOpen) return null;

  /* =========================
           UI
  ========================= */

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 space-y-4 shadow-xl">
        <button onClick={onClose} className="absolute top-3 right-3">
          <X />
        </button>

        <h2 className="text-xl font-semibold text-center">
          Tạo Truyện Mới
        </h2>

        {/* Title */}
        <input
          placeholder="Tên truyện"
          value={formData.title}
          onChange={handleTitleChange}
          className="w-full p-2 border rounded"
        />

        {/* Author */}
        <input
          name="tacGia"
          placeholder="Tác giả"
          value={formData.tacGia}
          onChange={handleInfoChange}
          className="w-full p-2 border rounded"
        />

        {/* Translator */}
        <input
          name="dichGia"
          placeholder="Dịch giả"
          value={formData.dichGia}
          onChange={handleInfoChange}
          className="w-full p-2 border rounded"
        />

        {/* Slug */}
        <div className="flex gap-2">
          <input
            value={formData.slug}
            onChange={handleSlugChange}
            className="flex-1 p-2 border rounded"
          />
          <button onClick={handleCheckSlug} className="px-3 bg-gray-800 text-white rounded">
            Check
          </button>
        </div>

        {/* Slug status */}
        {slugStatus === "checking" && <p>Checking...</p>}
        {slugStatus === "available" && <p className="text-green-500">OK</p>}
        {slugStatus === "taken" && <p className="text-red-500">Taken</p>}

        {/* Errors */}
        {Object.values(errors).map((err, i) => (
          <div key={i} className="text-red-500 text-sm flex gap-1">
            <AlertTriangle size={16} /> {err}
          </div>
        ))}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded"
          >
            <CheckCircle size={18} /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}