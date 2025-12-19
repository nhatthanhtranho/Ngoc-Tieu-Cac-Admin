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
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject();

      // object-cover (crop center)
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
  const file5to1Ref = useRef<HTMLInputElement>(null);
  const fileSmallRef = useRef<HTMLInputElement>(null);

  const [banner5to1, setBanner5to1] = useState<BannerItem>({
    base64: null,
    width: 1500,
    height: 300,
  });

  const [bannerSmall, setBannerSmall] = useState<BannerItem>({
    base64: null,
    width: 768,
    height: 364,
  });

  /* ======================
     HANDLE SELECT
  ====================== */

  const handleSelect =
    (type: "5to1" | "small") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const banner = type === "5to1" ? banner5to1 : bannerSmall;
      const setBanner = type === "5to1" ? setBanner5to1 : setBannerSmall;

      try {
        const base64 = await resizeToBase64(
          file,
          banner.width,
          banner.height
        );
        setBanner({ ...banner, base64 });
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

  const uploadBanners = async () => {
    if (!banner5to1.base64 || !bannerSmall.base64) return;

    try {
      const { defaultUrl, smallUrl } =
        await getUploadBookBannerNgangUrl(book.slug);

      await Promise.all([
        fetch(defaultUrl, {
          method: "PUT",
          body: base64ToBlob(banner5to1.base64),
          headers: { "Content-Type": "image/webp" },
        }),
        fetch(smallUrl, {
          method: "PUT",
          body: base64ToBlob(bannerSmall.base64),
          headers: { "Content-Type": "image/webp" },
        }),
      ]);

      alert("✅ Upload banner thành công");
    } catch (err) {
      console.error(err);
      alert("❌ Upload thất bại");
    }
  };

  /* ======================
     PREVIEW
  ====================== */

  const preview5to1 =
    banner5to1.base64 ||
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
    <div className="flex flex-col gap-8 mt-6">
      {/* ========== 5:1 BANNER ========== */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative rounded-xl overflow-hidden border"
          style={{ width: 1500, height: 300 }}
        >
          <img
            src={preview5to1}
            className="w-full h-full object-cover"
            alt="Banner 5:1"
          />
          <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-1">
            Banner 5:1 (1500×300)
          </div>
        </div>

        <input
          ref={file5to1Ref}
          type="file"
          accept="image/*"
          hidden
          onChange={handleSelect("5to1")}
        />

        <button
          type="button"
          onClick={() => file5to1Ref.current?.click()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Chọn ảnh 5:1
        </button>
      </div>

      {/* ========== SMALL BANNER ========== */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative rounded-xl overflow-hidden border"
          style={{ width: 768, height: 364 }}
        >
          <img
            src={previewSmall}
            className="w-full h-full object-cover"
            alt="Banner small"
          />
          <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-1">
            Banner 2x1
          </div>
        </div>

        <input
          ref={fileSmallRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleSelect("small")}
        />

        <button
          type="button"
          onClick={() => fileSmallRef.current?.click()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Chọn ảnh 2:1
        </button>
      </div>

      {/* ========== UPLOAD ========== */}
      {banner5to1.base64 && bannerSmall.base64 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={uploadBanners}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
          >
            ☁️ Upload cả 2 banner
          </button>
        </div>
      )}
    </div>
  );
};
