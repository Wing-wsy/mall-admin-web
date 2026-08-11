import axios from "axios";
import { ElMessage } from "element-plus";

export interface ApiResult<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const request = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE || "/api",
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("mall_admin_token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResult;
    if (body && typeof body.code === "number" && body.code !== 0) {
      ElMessage.error(body.message || "请求失败");
      return Promise.reject(body);
    }
    return response;
  },
  (error) => {
    ElMessage.error(error?.message || "网络异常");
    return Promise.reject(error);
  }
);

export default request;
