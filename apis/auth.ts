import api from "@/configs/axios";
import { User } from "@/types/user";

export const AuthAPI = {
  async login(data: { email: string; password: string, rememberMe: boolean }): Promise<{ user: User, accessToken: string }> {
    const res = await api.post("/auth/login", data);
    console.log("Login Response Data:", res.data); // 👈 dòng này để debug
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async getProfile(): Promise<User> {
    const res = await api.get("/auth/profile");
    console.log("📦 [AuthAPI] /auth/profile response:", res.data);
    if (!res.data?.avatar) {
      console.warn("⚠️ [AuthAPI] Avatar missing in profile response:", res.data);
    }
    return res.data;
  },

  async loginWithGoogle(idToken: string): Promise<{ user: User; accessToken: string }> {
    // Gửi Google ID Token lên backend để xác thực
    const res = await api.post("/auth/firebase", { idToken });
    return res.data;
  },
};
