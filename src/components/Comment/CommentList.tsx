"use client";

import { useState, useEffect } from "react";

import { getCommentsInBook, seedComment } from "../../../apis/comments";
import CommentItem from "./CommentItem";
import { toast } from "react-toastify";

interface CommentListProps {
  bookSlug: string;
}

export interface Comment {
  _id: string;
  username: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
  parentId: string;
}

export default function CommentList({ bookSlug }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [username, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | "">("");

  // 🔹 Load comments
  const fetchComments = async () => {
    if (!bookSlug) return;
    try {
      const res = await getCommentsInBook(bookSlug);
      setComments(res || []);
    } catch (e) {
      console.error(e);
      setComments([]);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [bookSlug]);

  // 🔹 Submit admin comment
  const handleSubmit = async () => {
    setError("");

    if (!username.trim()) {
      setError("Vui lòng nhập tên người dùng");
      return;
    }

    if (!content.trim()) {
      setError("Vui lòng nhập nội dung bình luận");
      return;
    }

    try {
      setSubmitting(true);
      await seedComment(bookSlug, username, avatarUrl, content, parentId);
      await fetchComments();
      toast.success("Thêm comment thành công!");
    } catch (e) {
      console.error("Add comment failed", e);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
      setUserName("");
      setAvatarUrl("");
      setContent("");
      setParentId("");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold">Bình luận</h2>
      </div>

      {/* Admin Add Comment */}
      <div className="mb-6 p-4 rounded-lg border border-slate-700 space-y-3">
        <input
          className="w-full rounded px-3 py-2 border"
          placeholder="Tên người dùng"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
        />

        <input
          className="w-full rounded px-3 py-2 border"
          placeholder="Avatar URL (optional)"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />

        {/* Parent comment select */}
        <select
          className="w-full rounded px-3 py-2 border"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">💬 Bình luận gốc</option>
          {comments.map((c) => (
            <option key={c._id} value={c._id}>
              ↳ Reply: {c.username.slice(0, 20)}
            </option>
          ))}
        </select>

        <textarea
          className="w-full rounded px-3 py-2 min-h-[90px] border"
          placeholder="Nội dung bình luận"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm font-medium">⚠ {error}</p>}

        <button
          disabled={submitting}
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded text-white"
        >
          {submitting ? "Đang gửi..." : "Thêm bình luận"}
        </button>
      </div>

      {/* List */}
      {comments.map((comment) => (
        <CommentItem comment={comment} />
      ))}
    </div>
  );
}
