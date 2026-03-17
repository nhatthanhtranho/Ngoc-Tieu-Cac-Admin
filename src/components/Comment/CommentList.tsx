"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

import {
  getCommentsInBook,
  seedComment,
  toggleSeedComment,
} from "../../../apis/comments";

import CommentItem from "./CommentItem";
import { buildCommentTree } from "./CommentNode";
import { useSeedUserStore } from "../../stores/seed.stote";
import { ToggleButton } from "./ToggleButton";
import { CalendarDays, User, UserPen } from "lucide-react";

interface CommentListProps {
  bookSlug: string;
  isSeed?: boolean;
  converter: string;
}

export interface Comment {
  _id: string;
  username: string;
  content: string;
  createdAt: string;
  parentId: string;
  replies?: Comment[];
  converter?: boolean;
}

export default function CommentList({
  bookSlug,
  isSeed,
  converter,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSeedComment, setIsSeedComment] = useState(isSeed);

  const { fetchSeedUsers, getSeedUsers } = useSeedUserStore();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [username, setUserName] = useState("");
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | "">("");

  const [isRandomUser, setIsRandomUser] = useState(false);
  const [isRandomDate, setIsRandomDate] = useState(false);
  const [isConverterUser, setIsConverterUser] = useState(false);

  const users = getSeedUsers();

  /* ------------------------- Build comment tree ------------------------- */
  const commentTree = useMemo(() => {
    return buildCommentTree(comments);
  }, [comments]);

  /* ------------------------------ Fetch comments ------------------------------ */
  const fetchComments = async () => {
    if (!bookSlug) return;
    try {
      const res = await getCommentsInBook(bookSlug);

      if (res?.seedEnabled !== undefined) {
        setIsSeedComment(res.seedEnabled);
      }

      setComments(res?.comments || res || []);
    } catch (e) {
      console.error(e);
      setComments([]);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchSeedUsers();
  }, [bookSlug]);

  /* --------------------------- Toggle seed comment --------------------------- */
  const handleToggleSeedComment = async () => {
    const nextValue = !isSeedComment;

    try {
      setIsSeedComment(nextValue);
      await toggleSeedComment(bookSlug, nextValue);
      toast.success(nextValue ? "Đã bật seed comment" : "Đã tắt seed comment");
    } catch (e) {
      console.error(e);
      setIsSeedComment(!nextValue);
      toast.error("Không thể thay đổi trạng thái seed comment");
    }
  };

  /* ---------------------------- Submit comment ---------------------------- */
  const handleSubmit = async () => {
    setError("");

    const trimmedUsername = username.trim();
    const trimmedContent = content.trim();

    if (!isRandomUser && !isConverterUser && !trimmedUsername) {
      setError("Vui lòng nhập tên người dùng");
      return;
    }

    if (!trimmedContent) {
      setError("Vui lòng nhập nội dung bình luận");
      return;
    }

    try {
      setSubmitting(true);

      await seedComment(
        bookSlug,
        isConverterUser ? converter : trimmedUsername,
        trimmedContent,
        parentId,
        isRandomUser,
        isConverterUser,
        isRandomDate,
      );

      await fetchComments();
      toast.success("Thêm comment thành công!");
    } catch (e) {
      console.error("Add comment failed", e);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
      setUserName("");
      setContent("");
      setParentId("");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold">Bình luận</h2>

        <button
          onClick={handleToggleSeedComment}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 
          ${isSeedComment ? "bg-green-500" : "bg-gray-300"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
            ${isSeedComment ? "translate-x-5" : ""}`}
          />
        </button>
      </div>

      {/* Admin Add Comment */}
      <div className="mb-6 p-4 rounded-lg border border-slate-700 space-y-3">
        <div className="flex items-center gap-2">
          <ToggleButton
            label="User"
            icon={User}
            checked={isRandomUser}
            onChange={() => {
              setIsRandomUser(!isRandomUser);
              setIsConverterUser(false);
            }}
          />

          <ToggleButton
            label="Date"
            icon={CalendarDays}
            checked={isRandomDate}
            onChange={() => setIsRandomDate(!isRandomDate)}
          />

          <ToggleButton
            label="Cvt"
            icon={UserPen}
            checked={isConverterUser}
            onChange={() => {
              const nextState = !isConverterUser;
              setIsConverterUser(nextState);
              setIsRandomUser(false);
              if (nextState) setUserName(converter);
            }}
          />
        </div>

        {/* Seed user select */}
        <select
          className="w-full rounded px-3 py-2 border"
          value={username}
          disabled={isConverterUser}
          onChange={(e) => {
            const user = users.find((u) => u.username === e.target.value);
            if (!user) return;
            setUserName(user.username);
          }}
        >
          <option value="">👤 Chọn seed user</option>
          {users.map((u) => (
            <option key={u.username} value={u.username}>
              {u.username}
            </option>
          ))}
        </select>

        <input
          className="w-full rounded px-3 py-2 border"
          placeholder="Tên người dùng"
          value={username}
          disabled={isConverterUser}
          onChange={(e) => setUserName(e.target.value)}
        />
        {/* Parent comment */}
        <select
          className="w-full rounded px-3 py-2 border"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">💬 Bình luận gốc</option>
          {comments.map((c) => (
            <option key={c._id} value={c._id}>
              ↳ Reply: {c?.username?.slice(0, 20)}
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

      {/* Comment list */}
      {commentTree.map((comment) => (
        <CommentItem key={comment._id} comment={comment} />
      ))}
    </div>
  );
}
