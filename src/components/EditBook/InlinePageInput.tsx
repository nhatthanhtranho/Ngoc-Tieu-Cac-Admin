import { useState, useEffect, useRef } from "react";

export default function InlinePageInput({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentPage.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSubmit = () => {
    const newPage = parseInt(value, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      onChange(newPage);
    }
    setEditing(false);
  };

  return (
    <span
      className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium shadow-sm min-w-[110px] text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition"
      onClick={() => setEditing(true)}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={totalPages}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-16 text-center bg-transparent outline-none border-b border-gray-400 dark:border-gray-500"
        />
      ) : (
        <>Trang {currentPage} / {totalPages}</>
      )}
    </span>
  );
}
