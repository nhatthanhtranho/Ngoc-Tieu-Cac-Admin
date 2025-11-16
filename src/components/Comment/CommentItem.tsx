"use client";

import { motion } from "framer-motion";
import { Heart, MessageSquare, Pin } from "lucide-react";
import { useState } from "react";
import { Comment } from "./CommentList";

interface CommentItemProps {
  comment: Comment;
  depth?: number; // cấp hiện tại
  onLike?: (id: string) => void;
  onReplySubmit?: (parent: Comment, content: string) => void;
}

const MAX_DEPTH = 2; // Giới hạn 2 cấp

export default function CommentItem({
  comment,
  depth = 1,
  onLike,
  onReplySubmit,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const isMaxDepth = depth >= MAX_DEPTH;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 mb-3 border bg-slate-900/30 backdrop-blur-sm transition-all ${
        comment.isPinned
          ? "border-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
          : "border-slate-700/50 hover:border-emerald-400/40"
      } ${depth > 1 ? "ml-10 border-l-2 border-slate-700/40 pl-4" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <img
            src={comment.user.avatar || "/avatar-default.png"}
            alt={comment.user.name}
            width={32}
            height={32}
            className="rounded-full border border-slate-700/60"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-slate-100 text-sm">
                {comment.user.name}
              </span>
              {comment.isPinned && (
                <Pin size={14} className="text-emerald-400 ml-1" />
              )}
            </div>
            <span className="text-[12px] text-slate-400">
              {new Date(comment.createdAt).toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Nội dung */}
      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
        {comment.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-5 mt-3">
        <button
          onClick={() => onLike?.(comment._id)}
          className="flex items-center gap-1 text-slate-400 hover:text-pink-400 transition"
        >
          <Heart
            size={16}
            className={comment.likes > 0 ? "fill-pink-500 text-pink-500" : ""}
          />
          <span className="text-xs">{comment.likes}</span>
        </button>

        {!isMaxDepth && (
          <button
            onClick={() => setShowInput((s) => !s)}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition"
          >
            <MessageSquare size={16} />
            <span className="text-xs">Trả lời</span>
          </button>
        )}

        {comment.replies?.length ? (
          <button
            onClick={() => setShowReplies((s) => !s)}
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            {showReplies
              ? `Ẩn ${comment.replies.length} phản hồi`
              : `Hiện ${comment.replies.length} phản hồi`}
          </button>
        ) : null}
      </div>

      {/* Danh sách reply */}
      {showReplies &&
        comment.replies &&
        comment.replies.length > 0 &&
        depth < MAX_DEPTH && (
          <div className="mt-4 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                depth={depth + 1}
                onLike={onLike}
                onReplySubmit={onReplySubmit}
              />
            ))}
          </div>
        )}
    </motion.div>
  );
}
