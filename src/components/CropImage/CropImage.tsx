/* eslint-disable @typescript-eslint/no-explicit-any */
import { Image as ImageIcon } from "iconsax-react";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";

interface CropImageProps {
  onCropComplete: (result: { small: string; default: string }) => void;
}

// ==================== ⚙️ CONFIG DỄ TÙY CHỈNH ====================
const IMAGE_OPTIMIZE_CONFIG = {
  aspectRatio: 2 / 3,
  smallSize: { width: 200, height: 300 }, // thumbnail nhỏ
  defaultSize: { width: 450, height: 675 }, // ảnh mặc định
  webpQuality: 1,
  webpMime: "image/webp",
};
// ================================================================

export default function CropImage({ onCropComplete }: CropImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("");

  // Đọc file khi người dùng chọn ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onCropCompleteCallback = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // --- Hàm resize & convert WebP ---
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

    return new Promise<string>((resolve) => {
      canvas.toBlob(
        (blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob!);
        },
        IMAGE_OPTIMIZE_CONFIG.webpMime,
        IMAGE_OPTIMIZE_CONFIG.webpQuality
      );
    });
  };

  // --- Tạo 3 kích thước ảnh ---
  const showCroppedImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    const { smallSize, defaultSize } = IMAGE_OPTIMIZE_CONFIG;

    const small = await resizeAndConvertWebp(
      image,
      croppedAreaPixels,
      smallSize.width,
      smallSize.height
    );
    const defaultImg = await resizeAndConvertWebp(
      image,
      croppedAreaPixels,
      defaultSize.width,
      defaultSize.height
    );

    console.table([
      { Type: "Small", Size: `${smallSize.width}x${smallSize.height}` },
      { Type: "Default", Size: `${defaultSize.width}x${defaultSize.height}` },
    ]);

    onCropComplete({ small, default: defaultImg });
  }, [imageSrc, croppedAreaPixels, onCropComplete]);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Upload ảnh */}
      <label
        htmlFor="upload-file"
        className="cursor-pointer inline-flex items-center justify-center px-5 py-2 mt-2
                   bg-amber-500 text-white font-medium rounded-lg shadow-md
                   hover:bg-amber-600 transition-all duration-300 hover:scale-105"
      >
        <ImageIcon size={25} color="white" className="mr-2" />
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
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">
          📸 {fileName}
        </p>
      )}

      {/* Giao diện crop */}
      {imageSrc && (
        <div
          style={{
            position: "relative",
            width: 400,
            height: 400,
            background: "#222",
            marginTop: 10,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={IMAGE_OPTIMIZE_CONFIG.aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteCallback}
          />
        </div>
      )}

      {/* Slider zoom + nút crop */}
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
            onClick={showCroppedImage}
            className="mt-3 px-5 py-2 bg-sky-600 text-white rounded-lg font-semibold
                       hover:bg-sky-700 hover:scale-105 transition-all duration-300"
          >
            ✂️ Crop & Tạo 3 Ảnh WebP
          </button>
        </div>
      )}
    </div>
  );
}
