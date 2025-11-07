import { useState, useEffect } from "react";
// import CropImage from "../CropImage/CropImage";
import ChapterListView from "./ChapterListView";
import Select from "react-select";
import pako from "pako";
import { useParams } from "react-router-dom";
import { Book, fetchBookBySlug } from "../../../apis/books";
import { fetchAllCategories } from "../../../apis/categories";
import { getEndpoint } from "../../../apis";

export default function EditBookInfo() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [book, setBook] = useState<Book | null>(null);
  const [originalBook, setOriginalBook] = useState<Book | null>(null);
  const [previewSet, setPreviewSet] = useState<{
    small?: string;
    default?: string;
  }>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ label: string; value: string }>
  >([]);

  const fallbackBanner = "/assets/images/create-book/default-banner.webp";

  useEffect(() => {
    fetchAllCategories(setCategories);
  }, []);

  useEffect(() => {
    fetchBookBySlug(slug, setBook);
  }, [slug]);

  const onChange = (key: keyof Book, value: any) => {
    setBook((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  /** So sánh field thay đổi */
  const getChangedFields = (newData: Book, oldData: Book): Partial<Book> => {
    const changed: Partial<Book> = {};
    (Object.keys(newData) as (keyof Book)[]).forEach((key) => {
      const newValue = newData[key];
      const oldValue = oldData[key];
      if (Array.isArray(newValue) && Array.isArray(oldValue)) {
        const isDifferent =
          newValue.length !== oldValue.length ||
          newValue.some((v, i) => v !== oldValue[i]);
        if (isDifferent) (changed as any)[key] = newValue;
      } else if (newValue !== oldValue) {
        (changed as any)[key] = newValue;
      }
    });
    return changed;
  };

  const onSave = async () => {
    if (!book || !originalBook) return;
    const changedData = getChangedFields(book, originalBook);

    // ✅ Nếu có crop ảnh thì thêm field bannerImage gửi cùng
    if (previewSet.default && previewSet.small) {
      (changedData as any).bannerImage = previewSet;
    }

    if (Object.keys(changedData).length === 0) {
      alert("⚠️ Không có thay đổi nào để lưu.");
      return;
    }

    const jsonString = JSON.stringify(changedData);
    const compressed = pako.gzip(jsonString);
    const blob = new Blob([compressed], { type: "application/gzip" });
    const formDataToSend = new FormData();
    formDataToSend.append("file", blob, "book-info.json.gz");

    try {
      const response = await fetch(getEndpoint(`books/${book._id}`), {
        method: "PATCH",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Lỗi server (${response.status}): ${
            errorText || "Không rõ nguyên nhân"
          }`
        );
      }

      alert("✅ Lưu thay đổi thành công!");
      setOriginalBook(book);
    } catch (err) {
      console.error("❌ Lỗi khi lưu:", err);
      alert(
        `Đã xảy ra lỗi khi lưu thay đổi: ${
          err instanceof Error ? err.message : err
        }`
      );
    }
  };

  /** Lấy URL banner theo size */
  const getBannerUrl = (baseUrl: string | null, size: "small" | "default") => {
    if (!baseUrl || baseUrl === fallbackBanner) return fallbackBanner;

    // ⚡ Nếu là base64 thì trả đúng ảnh crop ra tương ứng
    if (baseUrl.startsWith("data:image")) {
      if (previewSet.small && previewSet.default) {
        return previewSet[size] || baseUrl;
      }
      return baseUrl;
    }

    // Nếu là URL file ảnh
    const baseWithoutExt = baseUrl.replace(/(\.webp|\.jpg|\.jpeg|\.png)$/i, "");
    const ext = baseUrl.match(/(\.webp|\.jpg|\.jpeg|\.png)$/i)?.[0] || ".webp";

    switch (size) {
      case "small":
        return `${baseWithoutExt}-small${ext}`;
      default:
        return `${baseWithoutExt}${ext}`;
    }
  };

  /** Sau khi crop */
  const handleCropComplete = (result: { small: string; default: string }) => {
    setPreviewSet(result);
    setPreview(result.default);
    setShowCrop(false);
    onChange("bannerURL", result.default);

    // ✅ lưu luôn base64 để gửi backend
    onChange("bannerImage", result);
  };

  if (!book) {
    return (
      <div className="p-6 text-center text-red-500">
        Không tìm thấy thông tin truyện.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          ✏️ Chỉnh sửa thông tin truyện
        </h2>

        {/* Ảnh bìa */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            Ảnh bìa (3 kích thước tự động)
          </label>

          <div className="flex flex-wrap gap-6">
            {[
              { size: "small", label: "Small (200x300)", w: 200, h: 300 },
              { size: "default", label: "Default (450x675)", w: 450, h: 675 },
            ].map(({ size, label, w, h }) => {
              const url = getBannerUrl(book.bannerURL || preview, size as any);
              return (
                <div key={size} className="flex flex-col items-center">
                  <div
                    className="relative rounded-xl overflow-hidden border-2 border-amber-300/70 
                      dark:border-sky-600/60 shadow-lg group hover:shadow-[0_0_20px_rgba(255,255,150,0.6)] 
                      transition-all duration-300"
                    style={{ width: `${w}px`, height: `${h}px` }}
                  >
                    <img
                      src={url || fallbackBanner}
                      alt={`Banner ${size}`}
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                      {label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút thao tác */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowCrop(true)}
              className="px-5 py-2 rounded-lg bg-yellow-500
                text-white font-medium hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,200,0.6)] transition-all"
            >
              📸 Tải lên & Crop ảnh
            </button>

            <button
              type="button"
              onClick={() => {
                setPreview(fallbackBanner);
                setPreviewSet({});
                onChange("bannerURL", fallbackBanner);
                onChange("bannerImage", undefined);
              }}
              className="px-5 py-2 rounded-lg bg-red-500/90 text-white font-medium hover:bg-red-600 transition-all"
            >
              🗑️ Xóa tất cả
            </button>
          </div>
        </div>

        {/* Modal crop ảnh */}
        {showCrop && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full">
              {/* <CropImage onCropComplete={handleCropComplete} /> */}
              <div className="text-center mt-3">
                <button
                  onClick={() => setShowCrop(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Các input --- */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Tên truyện</label>
            <input
              type="text"
              value={book.title}
              onChange={(e) => onChange("title", e.target.value)}
              className="mt-1 w-full border border-gray-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Tác giả</label>
            <input
              type="text"
              value={book.tacGia}
              onChange={(e) => onChange("tacGia", e.target.value)}
              className="mt-1 w-full border border-gray-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Dịch giả</label>
            <input
              type="text"
              value={book.dichGia}
              onChange={(e) => onChange("dichGia", e.target.value)}
              className="mt-1 w-full border border-gray-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Số chương hiện có</label>
          <input
            type="number"
            value={book.currentChapter ?? 0}
            disabled
            className="mt-1 w-full border border-gray-200 bg-gray-50 text-gray-600 rounded-lg p-2 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Mô tả</label>
          <textarea
            rows={15}
            value={book.description}
            onChange={(e) => onChange("description", e.target.value)}
            className="mt-1 w-full border border-gray-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Thể loại</label>
          <Select
            isMulti
            placeholder="Chọn thể loại..."
            value={(book.categories || []).map((c) => ({
              label: c,
              value: c,
            }))}
            onChange={(selected) =>
              onChange(
                "categories",
                selected.map((opt) => opt.value)
              )
            }
            options={categories}
            isClearable={false}
            isSearchable
            className="mt-1"
          />
        </div>

        <button
          onClick={onSave}
          className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 cursor-pointer text-white rounded-lg"
        >
          Lưu thay đổi
        </button>
      </div>

      <div className="mt-8">
        <ChapterListView
          numberOfChapters={book.currentChapter}
          bookSlug={book.slug}
        />
      </div>
    </>
  );
}
