import axios from "axios";
import { useAuthState } from "../src/stores/auth.store";

const endpoint = "https://dhstn97hlf.execute-api.ap-southeast-1.amazonaws.com";

export const api = axios.create({
  baseURL: endpoint,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthState.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export function getEndpoint(path: string): string {
  return `${endpoint}/${path}`;
}
