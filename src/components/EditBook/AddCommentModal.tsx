import { useState } from "react";
import Select, { components } from "react-select";
import { toast } from "react-toastify";
import CommentItem from "../Comment/CommentItem";
import { users } from "../../constants/user";

interface AddCommentModalProps {
  bookSlug: string;
  onClose: () => void;
}

const OptionWithAvatarAndGender = (props: any) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        <img
          src={props.data.avatarUrl}
          alt={props.data.name}
          className="w-6 h-6 rounded-full"
        />
        <span>{props.data.name}</span>
      </div>
    </components.Option>
  );
};

const SingleValueWithAvatarAndGender = (props: any) => {
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        <img
          src={props.data.avatarUrl}
          alt={props.data.name}
          className="w-6 h-6 rounded-full"
        />
        <span>{props.data.name}</span>
      </div>
    </components.SingleValue>
  );
};

export default function AddCommentModal({
  bookSlug,
  onClose,
}: AddCommentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<(typeof users)[0] | null>(
    null
  );
  const [content, setContent] = useState("");
  const [genderFilter, setGenderFilter] = useState<"male" | "female" | null>(
    null
  );

  const filteredUsers = genderFilter
    ? users.filter((u) => u.gender === genderFilter)
    : users;

  const handleCreateComment = async () => {
    if (!content) {
      setError("Nội dung comment không được để trống.");
      return;
    }
    if (!selectedUser) {
      setError("Bạn cần chọn 1 người dùng.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookSlug,
          userIds: [selectedUser.id],
          content,
        }),
      });

      if (!res.ok) throw new Error("Tạo comment thất bại");

      toast.success("Tạo comment thành công!");
      onClose();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 h-screen bg-black/30">
      <div className="bg-white rounded-2xl overflow-hidden shadow w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <div className="p-6 pb-4">
          <h3 className="text-xl font-semibold mb-4">Thêm comment</h3>
          {selectedUser && content && (
            <div className="mt-4">
              <CommentItem
                comment={{
                  content,
                  _id: "",
                  likes: 0,
                  createdAt: new Date().toString(),
                  isPinned: false,
                  user: {
                    _id: selectedUser.id,
                    name: selectedUser.name,
                    avatar: selectedUser.avatarUrl,
                  },
                }}
              />
            </div>
          )}
          {/* Nút chọn Nam / Nữ */}
          <div className="flex gap-2 mb-4 pt-5">
            <button
              className={`px-3 py-1 rounded ${
                genderFilter === "male"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() =>
                setGenderFilter((prev) => (prev === "male" ? null : "male"))
              }
            >
              Nam
            </button>
            <button
              className={`px-3 py-1 rounded ${
                genderFilter === "female"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() =>
                setGenderFilter((prev) => (prev === "female" ? null : "female"))
              }
            >
              Nữ
            </button>
          </div>

          {/* Select user */}
          <Select
            placeholder="Chọn nhân vật..."
            value={selectedUser}
            onChange={(option) => setSelectedUser(option as any)}
            options={filteredUsers}
            getOptionLabel={(option: any) => option.name}
            getOptionValue={(option: any) => option.id}
            components={{
              Option: OptionWithAvatarAndGender,
              SingleValue: SingleValueWithAvatarAndGender,
            }}
            isClearable
          />

          {/* Preview comment */}

          <label className="block mb-2 font-medium mt-4">Nội dung</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
            placeholder="Nhập nội dung comment..."
          />

          {error && <p className="text-red-500 mb-2">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCreateComment}
              className={`text-white w-24 rounded ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#335495] hover:bg-[#2d3a76]"
              }`}
              disabled={loading}
            >
              {loading ? "Đang tạo..." : "Tạo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
