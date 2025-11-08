import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { login } from "../../../apis/auth";
import { toast } from "react-toastify";
import { useAuthState } from "../../stores/auth.store"; // 👉 thêm dòng này

interface LoginModalProps {
  onLoginSuccess: () => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setAccessToken } = useAuthState(); // 👉 lấy hàm setUser từ global state

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warn("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    try {
      const res = await login(email, password); // giả sử trả về { id, name, email, token }
      setUser(res.user);
      setAccessToken(res.accessToken);
      toast.success("Đăng nhập thành công!");
      onLoginSuccess();
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi đăng nhập");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative bg-gray-900 p-8 rounded-2xl w-full max-w-md text-white shadow-xl z-10">
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute top-3 left-3 text-gray-400" size={20} />
            <input
              autoComplete="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-3 left-3 text-gray-400" size={20} />
            <input
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition py-3 rounded-lg font-semibold text-white"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
