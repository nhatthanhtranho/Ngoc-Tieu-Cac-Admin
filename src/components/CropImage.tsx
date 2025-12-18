/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Image as ImageIcon } from "iconsax-react";
import { useState, useCallback, useMemo, useEffect } from "react";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";

interface CropImageProps {
  onCropComplete: (result: { small: string; default: string }) => void;
  aspectRatio: number; // chỉ nhận 1/4 hoặc 2/3
}

export default function CropImage({
  onCropComplete,
  aspectRatio,
}: CropImageProps) {
  // ==================== ⚙️ CONFIG THEO ASPECT ====================
  const IMAGE_OPTIMIZE_CONFIG = useMemo(() => {
    // 1 / 4 → banner ngang
    if (Math.abs(aspectRatio - 1 / 4) < 0.001) {
      return {
        aspectRatio: 1 / 4,
        smallSize: { width: 375, height: 175 },
        defaultSize: { width: 1024, height: 256 },
        cropBox: { width: 400, height: 100 }, // 👈 đúng tỉ lệ 1/4
      };
    }

    // 2 / 3 → ảnh dọc
    return {
      aspectRatio: 2 / 3,
      smallSize: { width: 200, height: 300 },
      defaultSize: { width: 450, height: 675 },
      cropBox: { width: 300, height: 450 },
    };
  }, [aspectRatio]);

  const CROPSIZE = useMemo(() => {
    // 1 / 4 → banner ngang
    if (Math.abs(aspectRatio - 1 / 4) < 0.001) {
      return {
        width:1024,
        height:256
      }
    }

    // 2 / 3 → ảnh dọc
    return {
      width:400,
      height:600
    }
  }, [aspectRatio]);




  const WEBP_CONFIG = {
    mime: "image/webp",
    quality: 1,
  };

  // ==================== 🧠 STATE ====================
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // ==================== 🔄 RESET KHI ĐỔI ASPECT ====================
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [IMAGE_OPTIMIZE_CONFIG.aspectRatio]);

  // ==================== 📂 LOAD IMAGE ====================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropCompleteCallback = useCallback(
    (_: any, croppedPixels: any) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  // ==================== 🖼️ RESIZE + WEBP ====================
  const resizeAndConvertWebp = async (
    image: HTMLImageElement,
    crop: any,
    targetWidth: number,
    targetHeight: number
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob!);
        },
        WEBP_CONFIG.mime,
        WEBP_CONFIG.quality
      );
    });
  };

  // ==================== ✂️ CROP ====================
  const handleCrop = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    const small = await resizeAndConvertWebp(
      image,
      croppedAreaPixels,
      IMAGE_OPTIMIZE_CONFIG.smallSize.width,
      IMAGE_OPTIMIZE_CONFIG.smallSize.height
    );

    const defaultImg = await resizeAndConvertWebp(
      image,
      croppedAreaPixels,
      IMAGE_OPTIMIZE_CONFIG.defaultSize.width,
      IMAGE_OPTIMIZE_CONFIG.defaultSize.height
    );

    onCropComplete({ small, default: defaultImg });
  }, [imageSrc, croppedAreaPixels, IMAGE_OPTIMIZE_CONFIG, onCropComplete]);

  // ==================== 🧩 UI ====================
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Upload */}
      <label
        htmlFor="upload-file"
        className="cursor-pointer inline-flex items-center justify-center px-5 py-2 mt-2
                   bg-amber-500 text-white font-medium rounded-lg shadow-md
                   hover:bg-amber-600 transition-all duration-300 hover:scale-105"
      >
        <ImageIcon size={24} color="white" className="mr-2" />
        Chọn ảnh để Crop
      </label>
      <input
        id="upload-file"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {fileName && (
        <p className="mt-2 text-sm text-gray-600 italic">📸 {fileName}</p>
      )}

      {/* Cropper */}
      {imageSrc && (
        <div
          style={{
            position: "relative",
            background: "#222",
            marginTop: 12,
            borderRadius: 10,
            overflow: "hidden",
            ...CROPSIZE
          }}
        >
          <Cropper
            key={IMAGE_OPTIMIZE_CONFIG.aspectRatio} // 👈 FIX QUAN TRỌNG
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={IMAGE_OPTIMIZE_CONFIG.aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteCallback}
            cropSize={CROPSIZE}
          />
        </div>
      )}

      {/* Zoom + Crop */}
      {imageSrc && (
        <div className="mt-4 flex flex-col items-center">
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value as number)}
            sx={{ width: 200, color: "#fbbf24" }}
          />
          <button
            onClick={handleCrop}
            className="mt-3 px-5 py-2 bg-sky-600 text-white rounded-lg font-semibold
                       hover:bg-sky-700 hover:scale-105 transition-all duration-300"
          >
            ✂️ Crop & Xuất WebP
          </button>
        </div>
      )}
    </div>
  );
}
