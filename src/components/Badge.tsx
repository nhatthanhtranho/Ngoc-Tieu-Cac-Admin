// Badge.tsx
"use client";

import React from "react";

interface BadgeProps {
  count?: number; // số hiển thị, có thể là 0
  max?: number;   // nếu count > max, hiển thị "max+"
  className?: string; // bổ sung class tuỳ ý
}

const Badge: React.FC<BadgeProps> = ({ count = 0, max, className = "" }) => {
  const displayCount =
    max !== undefined && count > max ? `${max}+` : count;

  return (
    <span
      className={`
        inline-block
        min-w-[18px]
        px-2
        text-sm
        font-semibold
        text-black
        text-center
        rounded-full
        bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500
        shadow-md
        border border-yellow-600
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
};

export default Badge;
