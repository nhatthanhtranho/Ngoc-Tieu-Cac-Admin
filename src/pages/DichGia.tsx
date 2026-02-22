"use client";

import { useEffect, useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { getConverterAvatarUrl } from "../utils/getBannerURL";
import { uploadAvatarToS3 } from "../../apis/s3"; // sửa đúng path file bạn để

import {
  Converter,
  createConverter,
  getConverters,
} from "../../apis/converter";

export default function DichGia() {
  const [converters, setConverters] = useState<Converter[]>([]);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState<Record<string, number>>(
    {},
  );

  // ================= LOAD DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getConverters();
        console.log(data);
        setConverters(data);
      } catch (err) {
        console.error("Load converters error:", err);
      }
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setUsername("");
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  // ================= RESIZE 50x50 =================
  const resizeImageTo50x50 = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 160;

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas not supported");

        const cropSize = Math.min(img.width, img.height);
        const sx = (img.width - cropSize) / 2;
        const sy = (img.height - cropSize) / 2;

        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Resize failed");

            const resizedFile = new File([blob], `${file.name}.webp`, {
              type: "image/webp",
            });

            resolve(resizedFile);
          },
          "image/webp",
          0.9,
        );
      };

      reader.readAsDataURL(file);
    });
  };

  // ================= CREATE =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setLoading(true);

      const newConverter: Converter = await createConverter(username);

      setConverters((prev) => [...prev, newConverter]);
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("Create converter error:", err);
      alert("Tạo thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ================= UPLOAD AVATAR =================
  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    username: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedFile = await resizeImageTo50x50(file);

      await uploadAvatarToS3(username, resizedFile);

      // update version để reload avatar
      setAvatarVersion((prev) => ({
        ...prev,
        [username]: Date.now(),
      }));

      // reset input để có thể upload lại cùng 1 file
      e.target.value = "";
    } catch (err) {
      console.error("Upload avatar error:", err);
      alert("Upload avatar thất bại");
    }
  };
  return (
    <div className="mx-auto px-20 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Danh sách Dịch Giả</h1>
        </div>

        <button
          onClick={openCreate}
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* List */}
      <div className="flex gap-6 flex-wrap">
        {converters.map((converter) => (
          <div
            key={converter.username}
            className="bg-white rounded-2xl border border-gray-100 
            shadow-sm hover:shadow-lg hover:-translate-y-1 
            transition-all duration-300 w-56 p-6 flex flex-col items-center text-center"
          >
            <label className="relative mb-4 cursor-pointer group">
              <img
                src={`${getConverterAvatarUrl(converter.username)}${
                  avatarVersion[converter.username]
                    ? `?v=${avatarVersion[converter.username]}`
                    : ""
                }`}
                alt={converter.username}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-50"
              />

              <div
                className="absolute inset-0 bg-black/40 rounded-full 
                opacity-0 group-hover:opacity-100 
                transition flex items-center justify-center text-white text-xs"
              >
                Đổi ảnh
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarUpload(e, converter.username)}
              />
            </label>

            <h3 className="font-semibold text-base text-gray-800">
              {converter.username}
            </h3>

            <div className="w-10 h-1 bg-indigo-500 rounded-full mt-3 opacity-70" />
          </div>
        ))}
      </div>

      {/* Modal tạo mới */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 cursor-pointer text-red-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-6 text-center">
              Thêm dịch giả
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border rounded px-4 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 
                text-white py-2 rounded transition font-medium cursor-pointer disabled:opacity-50"
              >
                {loading ? "Đang tạo..." : "Tạo mới"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
