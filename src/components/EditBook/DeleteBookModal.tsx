import { useState } from "react";
import { deleteAllChapters } from "../../../apis/chapters";
import { toast } from "react-toastify";
import { formatImageLink } from "../../utils/formatImageLink";

interface DeleteBookModal {
  bookSlug: string;
  onClose: () => void;
}

export default function DeleteBookModal({
  bookSlug,
  onClose,
}: DeleteBookModal) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State cho range min và max
  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteAllChapters(bookSlug);
      onClose();
      toast.success("Đã xóa tất cả chương!");
    } catch (err: any) {
      setError(err.message || "Delete thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 h-screen bg-black/30">
      <div className="bg-white rounded-2xl overflow-hidden shadow w-96 relative">
        <img
          src={formatImageLink("confirm-delete-bg.png")}
          className="w-full h-auto"
        />

        {/* Close button góc phải */}
        <div className="px-6 pb-4">
          <h3 className="text-xl font-semibold mb-2">Xóa tất cả chương</h3>
          <p className="text-gray-700 mb-2">
            Sau khi xóa tất cả chương không thể khôi phục lại!
          </p>

          {error && <p className="text-red-500 mb-2">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={handleDelete}
              className="hover:bg-[#2d3a76] text-white w-24 rounded bg-[#335495] cursor-pointer"
              disabled={loading}
            >
              Xác nhận
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border border-red-500 text-red-500 hover:bg-red-100 cursor-pointer transition"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
