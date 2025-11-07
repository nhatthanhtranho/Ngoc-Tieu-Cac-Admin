/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { User, Lock } from "lucide-react";
import AuthBaseModal from "./AuthBaseModal";
import AuthInput from "./AuthInput";
import { useAuthStore } from "@/store/auth.store";
import { useModalStore } from "@/store/modal.store";



export default function LoginModal() {
  const { isLoginModalOpen, closeLogin } = useModalStore()
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRememberMe(false);
  };

  // ✅ Validate trước khi gửi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() && !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      await login({ email, password, rememberMe });
      closeLogin();
      resetForm();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại");
    }
  };



  return (
    <AuthBaseModal
      open={isLoginModalOpen}
      onClose={() => {
        resetForm();
        setError("");
        closeLogin();
      }}
      title="Đăng Nhập"
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <AuthInput
          icon={<User />}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthInput
          icon={<Lock />}
          placeholder="Mật khẩu"
          passwordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-sm mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="text-gray-300">Nhớ đăng nhập</span>
          </label>
          <button type="button" className="text-emerald-400 hover:underline">
            Quên mật khẩu?
          </button>
        </div>

        {/* ⚠️ Hiển thị lỗi */}
        {error && (
          <p className="text-red-400 text-sm font-medium mt-1 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-lg mt-2 transition-colors ${loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
        >
          {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
        </button>
      </form>

      <div className="my-4 flex items-center justify-center">
        <span className="h-px bg-gray-600 w-1/4"></span>
        <span className="text-gray-400 text-sm mx-2">hoặc</span>
        <span className="h-px bg-gray-600 w-1/4"></span>
      </div>
    </AuthBaseModal>
  );
}
