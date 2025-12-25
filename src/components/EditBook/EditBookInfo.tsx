import { useState, useEffect } from "react";
import Select from "react-select";
import { useParams } from "react-router-dom";
import { BookA, CloudUpload, Eye, Heart, Tag } from "lucide-react";
import { toast } from "react-toastify";

import ChapterListView from "./ChapterListView";
import CommentList from "../Comment/CommentList";
import CropImage from "../CropImage";

import {
  Book,
  fetchBookBySlug,
  getUploadBookBannerUrl,
  syncBookData,
  updateBook,
} from "../../../apis/books";
import { categories } from "../../constants/category";
import { getBannerURL } from "../../utils/getBannerURL";
import { api } from "../../../apis";
import { BannerNgang } from "./BannerNgang";
import { toggleSeedComment } from "../../../apis/comments";

export default function EditBookInfo() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const [book, setBook] = useState<Book | null>(null);
  const [originalBook, setOriginalBook] = useState<Book | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (book) {
      setIsHidden(book.isHidden || false);
    }
  }, [book]);

  const [bannerSet, setBannerSet] = useState<{
    small?: string;
    default?: string;
  }>({});

  const [loading, setLoading] = useState(true);

  const fallbackBanner = "/assets/images/create-book/default-banner.webp";

  useEffect(() => {
    if (book) document.title = book.title;
  }, [book]);

  useEffect(() => {
    setLoading(true);
    fetchBookBySlug(slug, (b) => {
      setBook(b);
      setOriginalBook(b);
    }).finally(() => setLoading(false));
  }, [slug]);

  const onChange = (key: keyof Book, value: any) => {
    setBook((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

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

  const handleToggleHiddenBook = async () => {
    const nextValue = !isHidden;

    try {
      setIsHidden(nextValue);
      await updateBook(book?.slug as any, { isHidden: nextValue }, book as any);
      await handleSyncBook()
      toast.success(nextValue ? "Đã Ẩn Sách " : "Đã tắt Ẩn Sách");
    } catch (e) {
      console.error(e);
      setIsHidden(!nextValue); // rollback UI
      toast.error("Không thể thay đổi trạng thái seed comment");
    }
  };

  const handleSyncBook = async () => {
    setLoading(true);
    await syncBookData(slug).finally(() => setLoading(false));
    toast.success(`Hoàn tất sync ${book?.title}!`);
  };

  const onSave = async () => {
    if (!book || !originalBook) return;
    const changedData = getChangedFields(book, originalBook);
    if (Object.keys(changedData).length === 0) {
      toast.warning("Không có thay đổi nào để lưu!");
      return;
    }
    try {
      await updateBook(book.slug, changedData, book);
      toast.success("Lưu thay đổi thành công!");
      setOriginalBook(book);
    } catch (err) {
      console.error("❌ Lỗi khi lưu:", err);
      toast.error(
        `Đã xảy ra lỗi khi lưu thay đổi: ${err instanceof Error ? err.message : err
        }`
      );
    }
  };

  const handleCropComplete = (result: { small: string; default: string }) => {
    setBannerSet(result);
    setPreview(result.default);
    setShowCrop(false);
  };

  const base64ToBlob = (b64: string) => {
    const arr = b64.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const uploadBanner = async () => {
    if (!book || !bannerSet.default || !bannerSet.small) return;

    try {
      const data = await getUploadBookBannerUrl(book.slug);
      const { defaultUrl, smallUrl } = data;

      await Promise.all([
        fetch(defaultUrl, {
          method: "PUT",
          body: base64ToBlob(bannerSet.default),
          headers: { "Content-Type": "image/webp" },
        }),
        fetch(smallUrl, {
          method: "PUT",
          body: base64ToBlob(bannerSet.small),
          headers: { "Content-Type": "image/webp" },
        }),
      ]);

      alert("✅ Upload banner thành công!");
      onChange("bannerURL", defaultUrl.split("?")[0]);
      setPreview(null);
      setBannerSet({});
    } catch (err) {
      console.error("Upload failed", err);
      alert("❌ Upload banner thất bại.");
    }
  };

  if (!book)
    return (
      <div className="p-6 text-center text-red-500">
        Không tìm thấy thông tin truyện.
      </div>
    );

  return (
    <>
      <div className="container px-4 lg:px-0 mx-auto pt-6">
        <div className="flex gap-2 items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">
            Chỉnh sửa thông tin truyện
          </h2>
          <button
            onClick={handleSyncBook}
            disabled={loading}
            className={`p-3 rounded shadow text-white flex items-center justify-center ${loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600"
              }`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              <CloudUpload />
            )}
          </button>
        </div>

        {/* Modal crop ảnh */}
        {showCrop && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="p-6 max-w-md w-full">
              <CropImage
                aspectRatio={2 / 3}
                onCropComplete={handleCropComplete}
              />
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

        {/* Ảnh bìa vuông */}
        <div className="flex flex-row gap-2 mb-3 justify-end">
          Ẩn truyện
          <button
            onClick={async () => {
              await handleToggleHiddenBook()
            }}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 
          ${isHidden ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
            ${isHidden ? "translate-x-5" : ""}`}
            />
          </button>

        </div>
        <div className="flex flex-col lg:flex-row px-8 py-10 gap-4 bg-white rounded-2xl shadow">
          <div className="w-auto">
            <div className="flex flex-col flex-wrap gap-6">
              {[
                { size: "default", label: "Default (450x675)", w: 450, h: 675 },
              ].map(({ size, label, w, h }) => {
                const url = preview
                  ? preview
                  : getBannerURL(book.slug, "normal");
                return (
                  <div key={size} className="flex flex-col">
                    <div
                      className="relative rounded-xl overflow-hidden border-2 border-amber-300/70 shadow-lg group hover:shadow-[0_0_20px_rgba(255,255,150,0.6)] transition-all duration-300"
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
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  setShowCrop(true);
                }}
                className="px-5 py-2 rounded-lg bg-yellow-500 text-white font-medium hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,200,0.6)] transition-all"
              >
                Chọn ảnh
              </button>
              {bannerSet.default && bannerSet.small && (
                <button
                  type="button"
                  onClick={uploadBanner}
                  className="px-5 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-all"
                >
                  ☁️ Upload lên S3
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setBannerSet({});
                  onChange("bannerURL", fallbackBanner);
                }}
                className="px-5 py-2 rounded-lg bg-red-500/90 text-white font-medium hover:bg-red-600 transition-all"
              >
                Xóa tất cả
              </button>
            </div>
          </div>

          {/* Thông tin truyện */}
          <div className="w-full">
            {book.hasEbook && (
              <div className="flex flex-row gap-2 items-center">
                <BookA
                  color={
                    book.currentChapter === book.currentEbookChapter
                      ? "green"
                      : "yellow"
                  }
                  width={30}
                  height={30}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4 mt-5">
              <div>
                <label className="block text-sm font-medium">Tên truyện</label>
                <input
                  type="text"
                  value={book.title}
                  onChange={(e) => onChange("title", e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Tác giả</label>
                <input
                  type="text"
                  value={book.tacGia}
                  onChange={(e) => onChange("tacGia", e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Dịch giả</label>
                <input
                  type="text"
                  value={book.dichGia}
                  onChange={(e) => onChange("dichGia", e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
                />
              </div>


              <div>
                <label className="block text-sm font-medium">
                  Số chương hiện có
                </label>
                <input
                  type="number"
                  value={book.currentChapter ?? 0}
                  disabled
                  className="mt-1 w-full border border-gray-300 bg-gray-50 text-gray-600 rounded-lg p-2 cursor-not-allowed"
                />
                <label className="block text-sm font-medium mt-2">
                  Ebook đến chương
                </label>
                <input
                  type="number"
                  value={book.currentEbookChapter ?? 0}
                  disabled
                  className="mt-1 w-full border border-gray-300 bg-gray-50 text-gray-600 rounded-lg p-2 cursor-not-allowed"
                />
              </div>


            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Mô tả</label>
              <textarea
                rows={15}
                value={book.description}
                onChange={(e) => onChange("description", e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
              />
            </div>

            <div className="mb-4">
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

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <Tag size={18} />
                  </span>
                  <input
                    value={book.price}
                    onChange={(e) => onChange("price", e.target.value)}
                    type="number"
                    className="w-full border border-gray-300 rounded-lg pl-10 p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Love</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                    <Heart size={18} />
                  </span>
                  <input
                    value={book.loves}
                    onChange={(e) => onChange("loves", e.target.value)}
                    type="number"
                    className="w-full border border-gray-300 rounded-lg pl-10 p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  View
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(50000 + Math.random() * 50000);
                      onChange("totalViews", rand);
                      toast.success(
                        `🎯 Đã random view: ${rand.toLocaleString()}`
                      );
                    }}
                    className="px-2 py-0.5 text-[12px] bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Random
                  </button>
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                    <Eye size={18} />
                  </span>
                  <input
                    onChange={(e) => onChange("totalViews", e.target.value)}
                    value={book.totalViews}
                    type="number"
                    className="w-full border border-gray-300 rounded-lg pl-10 p-2 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 appearance-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex flex-row gap-4">
                <button
                  onClick={onSave}
                  className="mt-4 w-32 py-2 bg-emerald-500 hover:bg-emerald-600 cursor-pointer text-white rounded-lg"
                >
                  Lưu thay đổi
                </button>

                <button
                  onClick={async () => {
                    const res = await api.get(
                      `/admin/ebook/${book.slug}?currentChapter=${book.currentChapter}`
                    );
                    toast(
                      `Gửi yêu cầu convert ebook cho sách: ${book.slug} thành công`
                    );
                  }}
                  className="mt-4 w-32 py-2 bg-cyan-500 hover:bg-emerald-600 cursor-pointer text-white rounded-lg"
                >
                  Tạo ebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BannerNgang book={book} />

      <div className="mt-6 grid lg:grid-cols-2 gap-6 mx-auto container pb-10">
        <div className="bg-white rounded-2xl shadow">
          <ChapterListView
            numberOfChapters={book.currentChapter}
            bookSlug={book.slug}
          />
        </div>
        <div className="bg-white rounded-2xl shadow">
          <CommentList bookSlug={book.slug} isSeed={book.isSeed} />
        </div>
      </div>
    </>
  );
}
