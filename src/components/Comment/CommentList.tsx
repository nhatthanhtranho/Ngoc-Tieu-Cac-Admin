// frontend/src/components/CommentList.tsx
"use client";

import { useState, useEffect } from "react";
import CommentItem from "./CommentItem";
import { api } from "../../../apis";

interface CommentListProps {
  bookSlug: string;
}

export interface CommentUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Comment {
  _id: string;
  user: CommentUser;
  content: string;
  likes: number;
  isPinned: boolean;
  createdAt: string;
  replies?: Comment[];
}

export default function CommentList({ bookSlug }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Lấy comment theo bookSlug
  useEffect(() => {
    if (!bookSlug) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/books/slug/${bookSlug}/comments`);
        setComments(res.data || []);
      } catch (error) {
        console.error("Lỗi khi tải bình luận:", error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [bookSlug]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Bình luận</h2>
        </div>
        <span className="text-sm text-slate-400 italic">
          {comments.length} bình luận
        </span>
      </div>

      {loading ? (
        <p className="text-center text-slate-400/80 italic py-6">
          Đang tải bình luận...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-center text-slate-400/80 italic py-6">
          Chưa có bình luận nào, hãy là người đầu tiên!
        </p>
      ) : (
        comments.map((c) => <CommentItem key={c._id} comment={c} depth={1} />)
      )}
    </div>
  );
}
