"use client";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Comment } from "./CommentList";
import { api } from "../../../apis";
import { getConverterAvatarUrl } from "../../utils/getBannerURL";

interface CommentItemProps {
  comment: Comment;
  depth?: number;
}

export default function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  async function handleDeleteComment(commentId: string) {
    console.log("Deleting comment", commentId);
    try {
      await api.post("/admin/comments/delete", { commentId });
      window.location.reload();
    } catch (err) {
      console.error("Delete comment failed", err);
    }
  }

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
              src={
                comment.converter
                  ? getConverterAvatarUrl(comment.username)
                  : comment.avatarUrl
              }
              alt={comment.username}
              className="rounded-full object-cover border border-slate-700/60 w-10 h-10"
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.username}
                </span>

                {comment.converter && (
                  <span className="px-2 py-[2px] text-[11px] font-semibold rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    Dịch giả
                  </span>
                )}
              </div>

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

          {/* Delete button */}
          <button
            onClick={() => handleDeleteComment(comment._id)}
            className="p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
            title="Xóa bình luận"
          >
            <Trash2 size={16} />
          </button>
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
            <CommentItem
              key={reply._id}
              comment={reply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}