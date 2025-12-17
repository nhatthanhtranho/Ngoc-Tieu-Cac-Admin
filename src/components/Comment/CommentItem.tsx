"use client";

import { motion } from "framer-motion";
import { Comment } from "./CommentList";

interface CommentItemProps {
  comment: Comment;
  depth?: number;
}

export default function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-3"
    >
      {/* Comment box */}
      <div
        className="rounded-xl p-4 border backdrop-blur-sm transition-all"
        style={{ marginLeft: depth * 24 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <img
              src={comment.avatarUrl}
              alt={comment.username}
              className="rounded-full object-cover border border-slate-700/60 w-10 h-10"
            />
            <div>
              <span className="font-medium text-sm">{comment.username}</span>
              <div className="text-[12px] text-slate-800">
                {new Date(comment.createdAt).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung */}
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {comment.content}
        </p>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply._id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
