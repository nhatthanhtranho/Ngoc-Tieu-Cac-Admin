"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface AuthInputProps {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  passwordToggle?: boolean;
}

export default function AuthInput({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  passwordToggle = false,
}: AuthInputProps) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`relative rounded-lg transition-all duration-300 ${
        focused
          ? "shadow-[0_0_12px_2px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400"
          : "shadow-none"
      }`}
    >
      {/* icon trái */}
      <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 flex items-center justify-center">
        {icon}
      </div>

      <input
        type={passwordToggle ? (show ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full pl-9 pr-9 py-2 rounded-lg bg-[#2b2b2f] border border-gray-600 text-white placeholder-gray-400 focus:outline-none text-sm transition-all duration-300 ${
          focused ? "border-emerald-400" : "border-gray-600"
        }`}
      />

      {/* icon toggle (Eye/EyeOff) */}
      {passwordToggle && (
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-emerald-400 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
