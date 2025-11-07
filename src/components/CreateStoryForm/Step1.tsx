/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from 'react';
import { StoryFormData } from './index';
import CropImage from '../CropImage/CropImage';

interface Step1FormProps {
  formData: StoryFormData;
  onInfoChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onTagsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckSlug: () => void;
  handleChangeBannerImage: (result: { small: string; medium: string; default: string }) => void;
  slugAvailable: boolean | null;
}

export default function Step1Form({
  formData,
  onInfoChange,
  onTagsChange,
  onCheckSlug,
  slugAvailable,
  handleChangeBannerImage,
}: Step1FormProps) {
  const [preview, setPreview] = useState<string | null>(formData.bannerImage?.small || null);
  const [showCropper, setShowCropper] = useState(false);

  const handleCropComplete = (result: { small: string; medium: string; default: string }) => {
    setPreview(result.medium);
    setShowCropper(false);
    handleChangeBannerImage(result);
  };

  return (
    <div className="space-y-6">
      {/* --- Upload ảnh bìa --- */}
      

      {/* --- Crop modal --- */}
  

      {/* --- Input fields --- */}
      {[
        { label: 'Tên truyện', name: 'title', placeholder: 'Nhập tên truyện' },
        { label: 'Tác giả', name: 'tacGia', placeholder: 'Nhập tên tác giả' },
        { label: 'Dịch giả', name: 'dichGia', placeholder: 'Nhập tên dịch giả (nếu có)' },
      ].map(({ label, name, placeholder }) => (
        <div key={name}>
          <label className="block text-sm font-semibold text-yellow-700 dark:text-sky-300 mb-1 tracking-wide">
            {label}
          </label>
          <input
            type="text"
            name={name}
            value={(formData as any)[name]}
            onChange={onInfoChange}
            placeholder={placeholder}
            className="w-full p-2.5 rounded-xl border-2 border-yellow-100 dark:border-sky-700 bg-white/70 dark:bg-gray-800/70 
                       focus:ring-2 focus:ring-sky-400 dark:focus:ring-amber-400 focus:border-transparent 
                       shadow-inner transition-all duration-200"
          />
        </div>
      ))}

      {/* --- Mô tả --- */}
      <div>
        <label className="block text-sm font-semibold text-yellow-700 dark:text-sky-300 mb-1 tracking-wide">
          Mô tả
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onInfoChange}
          rows={4}
          placeholder="Giới thiệu nội dung truyện..."
          className="w-full p-3 rounded-xl border-2 border-yellow-100 dark:border-sky-700 bg-white/70 dark:bg-gray-800/70 
                     focus:ring-2 focus:ring-sky-400 dark:focus:ring-amber-400 shadow-inner resize-none transition-all"
        />
      </div>

      {/* --- Slug --- */}
      <div>
        <label className="block text-sm font-semibold text-yellow-700 dark:text-sky-300 mb-1 tracking-wide">
          Slug
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={onInfoChange}
            placeholder="vd: truyen-huyen-thoai"
            disabled={slugAvailable === true}
            className={`flex-1 rounded-xl border-2 p-2.5 bg-white/70 dark:bg-gray-800/70 
                        transition-all duration-300 ${
              slugAvailable === true
                ? 'border-green-400 bg-green-50 dark:bg-green-900/40'
                : 'border-yellow-100 dark:border-sky-700 focus:ring-2 focus:ring-sky-400 dark:focus:ring-amber-400'
            }`}
          />
          <button
            type="button"
            onClick={onCheckSlug}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold hover:shadow-[0_0_15px_rgba(100,200,255,0.5)] transition-all"
          >
            Kiểm tra
          </button>
        </div>

        {formData.slug && slugAvailable === true && (
          <p className="text-green-600 mt-1 text-sm">Slug hợp lệ ✅</p>
        )}
        {formData.slug && slugAvailable === false && (
          <p className="text-red-600 mt-1 text-sm">Slug đã tồn tại ❌</p>
        )}
      </div>

      {/* --- Tags --- */}
      <div>
        <label className="block text-sm font-semibold text-yellow-700 dark:text-sky-300 mb-1 tracking-wide">
          Tags (phân cách bằng dấu ,)
        </label>
        <input
          type="text"
          value={formData.tagInput}
          onChange={onTagsChange}
          placeholder="vd: phiêu lưu, hành động, giả tưởng"
          className="w-full p-2.5 rounded-xl border-2 border-yellow-100 dark:border-sky-700 bg-white/70 dark:bg-gray-800/70 
                     focus:ring-2 focus:ring-sky-400 dark:focus:ring-amber-400 shadow-inner transition-all"
        />
      </div>
    </div>
  );
}
