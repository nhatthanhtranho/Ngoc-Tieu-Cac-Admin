/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useRef, useEffect } from 'react';
import { Chapter } from '@/types/chapter';
import ChapterItem from './ChapterItem';

interface Step2ChaptersProps {
  chapters: Chapter[];
  deletedChaptersCount: number;
  activeIndex: number | null;
  onFolderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChapterChange: (index: number, field: keyof Chapter, value: string) => void;
  onRemoveChapter: (index: number) => void;
  onUndoDelete: () => void;
  onSetActive: (index: number) => void;
}

export default function Step2Chapters({
  chapters,
  deletedChaptersCount,
  activeIndex,
  onFolderUpload,
  onChapterChange,
  onRemoveChapter,
  onUndoDelete,
  onSetActive,
}: Step2ChaptersProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folderInputRef.current) {
      // Chỉ cho phép chọn thư mục
      (folderInputRef.current as any).webkitdirectory = true;
    }
  }, []);

  // 🔢 Sắp xếp chương theo tên (ưu tiên số)
  const sortedChapters = [...chapters].sort((a, b) => {
    const nameA = a.title.toLowerCase();
    const nameB = b.title.toLowerCase();
    const numA = parseInt(nameA.match(/\d+/)?.[0] || '0');
    const numB = parseInt(nameB.match(/\d+/)?.[0] || '0');

    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA - numB;
    }

    return nameA.localeCompare(nameB, 'vi');
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📖 Danh sách chương</h3>

        <div className="flex gap-2 items-center">
          {/* Folder upload */}
          <input
            type="file"
            multiple
            ref={folderInputRef}
            onChange={onFolderUpload}
            className="px-3 py-1 border rounded-lg cursor-pointer"
          />

          {deletedChaptersCount > 0 && (
            <button
              type="button"
              onClick={onUndoDelete}
              className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white"
            >
              Hoàn tác
            </button>
          )}
        </div>
      </div>

      {/* Nếu chưa có chương */}
      {sortedChapters.length === 0 && (
        <p className="text-gray-500 text-sm italic">
          Chưa có chương nào. Hãy upload thư mục chứa file .txt
        </p>
      )}

      {/* Danh sách chương */}
      {sortedChapters.slice(0, 10).map((chapter, idx) => (
        <ChapterItem
          key={chapter.title}
          chapter={chapter}
          index={idx}
          isActive={activeIndex === idx}
          onChange={onChapterChange}
          onRemove={onRemoveChapter}
          onClick={() => onSetActive(idx)}
        />
      ))}
      {sortedChapters.length > 10 && <span>{`Và ${sortedChapters.length - 10} chương khác`}</span>}
    </div>
  );
}
