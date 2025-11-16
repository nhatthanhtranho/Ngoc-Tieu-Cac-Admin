import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

import { getCommentsInBook } from "../../../apis/comments";
import CommentItem from "./CommentItem";
import AddCommentModal from "../EditBook/AddCommentModal";

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
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);

  // ✅ Lấy comment theo bookSlug
  useEffect(() => {
    if (!bookSlug) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await getCommentsInBook(bookSlug);
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
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              Bình luận ({comments.length})
            </h2>
          </div>
          <button
            onClick={() => setShowAddCommentModal(true)}
            className="bg-green-600 rounded p-2 cursor-pointer hover:bg-green-800 transition-colors duration-200 shadow text-white"
          >
            <Plus className="w-6 h-6" />
          </button>{" "}
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
      {showAddCommentModal && (
        <AddCommentModal
          bookSlug={bookSlug}
          onClose={() => setShowAddCommentModal(false)}
        />
      )}
    </>
  );
}
