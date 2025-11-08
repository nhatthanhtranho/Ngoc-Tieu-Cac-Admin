import axios from "axios";

import { getEndpoint } from ".";

export async function login(email: string, password: string) {
  try {
    const res = await axios.post<{
      accessToken: string,
      user: {
        email: string,
        displayName: string,
      }
    }>(getEndpoint("auth/login"), {
      email,
      password,
    });
    return res.data
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        throw new Error("Email hoặc mật khẩu không đúng");
      } else if (err.response) {
        throw new Error(`Tài khoản không tồn tại`);
      } else {
        throw new Error("Không thể kết nối đến server");
      }
    } else {
      throw new Error("Đã xảy ra lỗi không xác định");
    }
  }
}
