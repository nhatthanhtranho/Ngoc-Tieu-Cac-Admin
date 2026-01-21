"use client";

import { useRef, useState } from "react";
import { getUploadBookBannerNgangUrl } from "../../../apis/books";
import { getBannerURL } from "../../utils/getBannerURL";

/* ======================
   TYPES
====================== */

type BannerItem = {
  base64: string | null;
  width: number;
  height: number;
};

interface BannerNgangProps {
  book: {
    slug: string;
  };
  fallbackBanner?: string;
}

/* ======================
   UTILS
====================== */

const base64ToBlob = (base64: string) => {
  const [header, data] = base64.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/webp";

  const byteChars = atob(data);
  const byteNums = new Array(byteChars.length);

  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }

  return new Blob([new Uint8Array(byteNums)], { type: mime });
};

const resizeToBase64 = (
  file: File,
  width: number,
  height: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject();

      // object-cover crop center
      const scale = Math.max(width / img.width, height / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const dx = (width - sw) / 2;
      const dy = (height - sh) / 2;

      ctx.drawImage(img, dx, dy, sw, sh);
      resolve(canvas.toDataURL("image/webp", 0.9));
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/* ======================
   COMPONENT
====================== */

export const BannerNgang = ({ book, fallbackBanner }: BannerNgangProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  // Banner lớn 21:9 (desktop)
  const [bannerLarge, setBannerLarge] = useState<BannerItem>({
    base64: null,
    width: 1680,
    height: 720,
  });

  // Banner nhỏ 21:9 (tablet – nhẹ)
  const [bannerSmall, setBannerSmall] = useState<BannerItem>({
    base64: null,
    width: 768,
    height: 329, // 768 / 2.33 ≈ 329
  });

  /* ======================
     HANDLE SELECT (1 ảnh → tạo 2 bản)
  ====================== */

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const [largeBase64, smallBase64] = await Promise.all([
        resizeToBase64(file, bannerLarge.width, bannerLarge.height),
        resizeToBase64(file, bannerSmall.width, bannerSmall.height),
      ]);

      setBannerLarge({ ...bannerLarge, base64: largeBase64 });
      setBannerSmall({ ...bannerSmall, base64: smallBase64 });
    } catch (err) {
      console.error(err);
      alert("❌ Không xử lý được ảnh");
    } finally {
      e.target.value = "";
    }
  };

  /* ======================
     UPLOAD
  ====================== */

  const uploadBanner = async () => {
    if (!bannerLarge.base64 || !bannerSmall.base64) return;

    try {
      // API nên trả về 2 url: banner lớn + banner small
      // Ví dụ backend:
      // { defaultUrl, smallUrl }
      const { defaultUrl, smallUrl } =
        await getUploadBookBannerNgangUrl(book.slug);

      await Promise.all([
        fetch(defaultUrl, {
          method: "PUT",
          body: base64ToBlob(bannerLarge.base64),
          headers: { "Content-Type": "image/webp" },
        }),
        fetch(smallUrl, {
          method: "PUT",
          body: base64ToBlob(bannerSmall.base64),
          headers: { "Content-Type": "image/webp" },
        }),
      ]);

      alert("✅ Upload banner large + small thành công");
    } catch (err) {
      console.error(err);
      alert("❌ Upload thất bại");
    }
  };

  /* ======================
     PREVIEW
  ====================== */

  const previewLarge =
    bannerLarge.base64 ||
    getBannerURL(book.slug, "ngang") ||
    fallbackBanner;

  const previewSmall =
    bannerSmall.base64 ||
    getBannerURL(book.slug, "ngang-small") ||
    fallbackBanner;

  /* ======================
     RENDER
  ====================== */

  return (
    <div className="flex flex-col gap-10 mt-6">
      {/* ========== BANNER LARGE 1680x720 ========== */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-full max-w-4xl">
          <div
            className="relative rounded-xl overflow-hidden border w-full"
            style={{ aspectRatio: "21 / 9" }}
          >
            <img
              src={previewLarge}
              className="absolute inset-0 w-full h-full object-cover"
              alt="Banner 21:9 Large"
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-1">
              Banner lớn 21:9 (1680 × 720)
            </div>
          </div>
        </div>
      </div>

      {/* ========== BANNER SMALL 768x329 ========== */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-full max-w-2xl">
          <div
            className="relative rounded-xl overflow-hidden border w-full"
            style={{ aspectRatio: "21 / 9" }}
          >
            <img
              src={previewSmall}
              className="absolute inset-0 w-full h-full object-cover"
              alt="Banner 21:9 Small"
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-1">
              Banner tablet nhẹ (768 × 329)
            </div>
          </div>
        </div>
      </div>

      {/* ========== INPUT ========== */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleSelect}
      />

      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-5 py-2 bg-red-500 text-white rounded-lg"
        >
          Chọn ảnh (tạo 2 bản 21:9)
        </button>

        {bannerLarge.base64 && bannerSmall.base64 && (
          <button
            type="button"
            onClick={uploadBanner}
            className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
          >
            ☁️ Upload cả 2 banner
          </button>
        )}
      </div>
    </div>
  );
};
