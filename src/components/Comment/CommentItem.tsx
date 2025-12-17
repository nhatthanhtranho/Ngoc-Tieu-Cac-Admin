"use client";

import { motion } from "framer-motion";
import { Comment } from "./CommentList";

interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 mb-3 border backdrop-blur-sm transition-all`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <img
            src={comment.avatarUrl}
            alt={comment.username}
            className="rounded-full overflow-hidden object-cover object-center border border-slate-700/60 w-10 h-10"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{comment.username}</span>
            </div>
            <span className="text-[12px] text-slate-800">
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
      <p className="text-sm leading-relaxed whitespace-pre-line">
        {comment.content}
      </p>
    </motion.div>
  );
}
