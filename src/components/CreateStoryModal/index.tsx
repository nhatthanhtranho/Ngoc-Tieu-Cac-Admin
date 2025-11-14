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
}

interface CreateStoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (book: any) => void;
}

// ✅ HÀM CHUYỂN SLUG CHUẨN TIẾNG VIỆT
function slugVN(str: string) {
  if (!str) return "";
  const clean = str
    .normalize("NFD") // tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "") // xóa toàn bộ dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  return slugify(clean, { lower: true, strict: true, trim: true });
}

export default function CreateStoryFormModal({
  isOpen,
  onClose,
  onCreate,
}: CreateStoryFormModalProps) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    description: "",
    slug: "",
    tags: [],
    dichGia: "",
    tagInput: "",
    tacGia: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  useEffect(() => {}, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => {
      const newSlug = !slugEdited ? slugVN(value) : prev.slug; // ✅ dùng slugVN thay vì slugify
      return { ...prev, title: value, slug: newSlug };
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, slug: e.target.value }));
    setSlugEdited(true);
    setSlugStatus("idle"); // reset trạng thái check slug khi sửa
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
        .filter((tag) => tag !== ""),
    }));
  };

  const handleValidate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim())
      newErrors.title = "Tiêu đề không được để trống.";
    if (!formData.slug.trim()) newErrors.slug = "Slug không được để trống.";
    if (!formData.tacGia.trim()) newErrors.tacGia = "Nhập tên tác giả.";
    if (!formData.dichGia.trim()) newErrors.dichGia = "Nhập tên dịch giả.";
    if (slugStatus === "taken")
      newErrors.slug = "Slug đã tồn tại, vui lòng đổi slug khác.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!handleValidate()) return alert("⚠️ Kiểm tra lại thông tin!");
    try {
      const newBook = { ...formData, status: "Published", currentChapter: 0 };

      const res = await createBook(newBook);
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
      const isVald = await checkBookSlugValid(formData.slug);
      if (!isVald) {
        setSlugStatus("taken");
      } else {
        setSlugStatus("available");
      }
    } catch (err) {
      console.error(err);
      setSlugStatus("idle");
      alert("❌ Lỗi khi kiểm tra slug");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-50 to-white-100 p-4">
      <div className="relative w-full max-w-3xl bg-white/95 rounded-3xl shadow-2xl p-8 space-y-6 border border-teal-200 backdrop-blur-sm">
        <button
          className="absolute top-4 right-4 text-teal-400 hover:text-teal-600 transition-colors"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-medium text-teal-600 text-center drop-shadow-sm">
          🍑 Tạo Truyện Mới 🍑
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-teal-500 mb-1">
              Tên truyện
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="Nhập tên truyện"
              className="w-full p-3 rounded-xl border border-teal-300 bg-white text-teal-700 placeholder-teal-400 focus:ring-2 focus:ring-teal-400 shadow-sm hover:shadow-md transition-all"
            />
          </div>

          {/* Tác giả & Dịch giả */}
          {[
            { label: "Tác giả", name: "tacGia" },
            { label: "Dịch giả", name: "dichGia" },
          ].map(({ label, name }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-teal-500 mb-1">
                {label}
              </label>
              <input
                type="text"
                name={name}
                value={(formData as any)[name]}
                onChange={handleInfoChange}
                placeholder={`Nhập ${label.toLowerCase()}`}
                className="w-full p-3 rounded-xl border border-teal-300 bg-white text-teal-700 placeholder-teal-400 focus:ring-2 focus:ring-teal-400 shadow-sm hover:shadow-md transition-all"
              />
            </div>
          ))}

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-teal-500 mb-1">
              Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="vd: truyen-manga-ngon-tinh"
                className="flex-1 p-3 rounded-xl border border-teal-300 bg-white text-teal-700 placeholder-teal-400 focus:ring-2 focus:ring-teal-400 shadow-sm hover:shadow-md transition-all"
              />
              <button
                type="button"
                onClick={handleCheckSlug}
                className="px-4 py-2 bg-teal-300 hover:bg-teal-400 text-white font-semibold rounded-xl shadow-md transition-all"
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
        </div>

        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-teal-100 text-red-500 p-3 rounded-xl shadow-inner border border-teal-300">
            <ul className="list-disc list-inside">
              {Object.entries(errors).map(([k, v]) => (
                <li key={k} className="flex items-center gap-1">
                  <AlertTriangle size={16} /> {v}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-teal-400 hover:bg-teal-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <CheckCircle size={20} /> Lưu Truyện
          </button>
        </div>
      </div>
    </div>
  );
}
