import { Comment } from "./CommentList";

export interface CommentNode extends Comment {
  replies: CommentNode[];
}

export function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  // 1. Khởi tạo map
  for (const c of comments) {
    map.set(c._id, { ...c, replies: [] });
  }

  // 2. Gắn reply vào parent
  for (const c of comments) {
    const node = map.get(c._id)!;

    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.replies.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}
