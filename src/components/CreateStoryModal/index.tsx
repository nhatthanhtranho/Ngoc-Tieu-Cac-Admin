/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
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
  isFree: boolean;
}

interface CreateStoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (book: any) => void;
}

/* =========================
   SLUG VN + FREE HANDLER
========================= */

function slugVN(str: string) {
  if (!str) return "";
  const clean = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  return slugify(clean, { lower: true, strict: true, trim: true });
}

function applyFreeSlug(slug: string, isFree: boolean) {
  if (!slug) return "";

  if (isFree) {
    return slug.endsWith("-free") ? slug : `${slug}-free`;
  }

  return slug.replace(/-free$/, "");
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
    isFree: false,
  });

  useEffect(() => {}, []);

  /* =========================
        HANDLERS
  ========================= */

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setFormData((prev) => {
      let newSlug = prev.slug;

      if (!slugEdited) {
        const baseSlug = slugVN(value);
        newSlug = applyFreeSlug(baseSlug, prev.isFree);
      }

      return { ...prev, title: value, slug: newSlug };
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawSlug = e.target.value;

    setFormData((prev) => ({
      ...prev,
      slug: applyFreeSlug(rawSlug.replace(/-free$/, ""), prev.isFree),
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
      tags: value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }));
  };

  const handleValidate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim())
      newErrors.title = "Tiêu đề không được để trống.";
    if (!formData.slug.trim())
      newErrors.slug = "Slug không được để trống.";
    if (!formData.tacGia.trim())
      newErrors.tacGia = "Nhập tên tác giả.";
    if (!formData.dichGia.trim())
      newErrors.dichGia = "Nhập tên dịch giả.";
    if (slugStatus === "taken")
      newErrors.slug = "Slug đã tồn tại, vui lòng đổi slug khác.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!handleValidate()) return alert("⚠️ Kiểm tra lại thông tin!");

    try {
      const newBook = {
        ...formData,
        status: "Published",
        currentChapter: 0,
      };

      const res = await createBook(newBook as any);
      onCreate && onCreate(res);
      onClose();
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi lưu truyện");
    }
  };

  const handleCheckSlug = async () => {
    if (!formData.slug.trim()) return alert("Nhập slug trước khi kiểm tra!");

    try {
      setSlugStatus("checking");
      const isValid = await checkBookSlugValid(formData.slug);
      setSlugStatus(isValid ? "available" : "taken");
    } catch (err) {
      console.error(err);
      setSlugStatus("idle");
      alert("❌ Lỗi khi kiểm tra slug");
    }
  };

  if (!isOpen) return null;

  /* =========================
           UI
  ========================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-50 to-white-100 p-4">
      <div className="relative w-full max-w-3xl bg-white/95 rounded-3xl shadow-2xl p-8 space-y-6 border border-teal-200 backdrop-blur-sm">
        <button
          className="absolute top-4 right-4 text-teal-400 hover:text-teal-600"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-medium text-teal-600 text-center">
          🍑 Tạo Truyện Mới 🍑
        </h2>

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-teal-500 mb-1 block">
            Tên truyện
          </label>
          <input
            value={formData.title}
            onChange={handleTitleChange}
            className="w-full p-3 rounded-xl border border-teal-300"
          />
        </div>

        {/* Author & Translator */}
        {[
          { label: "Tác giả", name: "tacGia" },
          { label: "Dịch giả", name: "dichGia" },
        ].map(({ label, name }) => (
          <div key={name}>
            <label className="text-sm font-medium text-teal-500 mb-1 block">
              {label}
            </label>
            <input
              name={name}
              value={(formData as any)[name]}
              onChange={handleInfoChange}
              className="w-full p-3 rounded-xl border border-teal-300"
            />
          </div>
        ))}

        {/* Free Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-teal-500">Truyện Free</span>
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => {
                const newIsFree = !prev.isFree;
                return {
                  ...prev,
                  isFree: newIsFree,
                  slug: applyFreeSlug(
                    prev.slug.replace(/-free$/, ""),
                    newIsFree
                  ),
                };
              })
            }
            className={`w-12 h-6 rounded-full p-1 transition ${
              formData.isFree ? "bg-teal-400" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow transform transition ${
                formData.isFree ? "translate-x-6" : ""
              }`}
            />
          </button>
          {formData.isFree && (
            <span className="text-xs text-green-600 font-medium">-free</span>
          )}
        </div>

        {/* Slug */}
        <div>
          <label className="text-sm font-medium text-teal-500 mb-1 block">
            Slug
          </label>
          <div className="flex gap-2">
            <input
              value={formData.slug}
              onChange={handleSlugChange}
              className="flex-1 p-3 rounded-xl border border-teal-300"
            />
            <button
              onClick={handleCheckSlug}
              className="px-4 bg-teal-400 text-white rounded-xl"
            >
              Check
            </button>
          </div>

          {slugStatus === "checking" && (
            <p className="text-sm text-gray-500 mt-1">Đang kiểm tra...</p>
          )}
          {slugStatus === "available" && (
            <p className="text-sm text-green-600 mt-1">✅ Slug hợp lệ</p>
          )}
          {slugStatus === "taken" && (
            <p className="text-sm text-red-600 mt-1">❌ Slug đã tồn tại</p>
          )}
        </div>

        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
            {Object.values(errors).map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={16} /> {err}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-teal-400 text-white rounded-xl"
          >
            <CheckCircle size={20} /> Lưu Truyện
          </button>
        </div>
      </div>
    </div>
  );
}
