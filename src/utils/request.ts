import axios, { type InternalAxiosRequestConfig } from "axios";
import { ElMessage } from "element-plus";

export interface ApiResult<T = unknown> {
  code: number;
  message: string;
  data: T;
}

declare module "axios" {
  export interface AxiosRequestConfig {
    /** 登录等接口不携带旧 token */
    skipAuth?: boolean;
  }
}

const request = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE || "",
  timeout: 15000,
});

request.interceptors.request.use((config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
  if (!config.skipAuth) {
    const token = localStorage.getItem("mall_admin_token");
    if (token) {
      // Sa-Token token-name=Authorization，必须传裸 token，不能加 Bearer
      config.headers.set("Authorization", token);
    }
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResult;
    if (body && typeof body.code === "number" && body.code !== 0) {
      if (body.code === 401) {
        localStorage.removeItem("mall_admin_token");
        localStorage.removeItem("mall_admin_username");
        if (!location.pathname.includes("/login")) {
          ElMessage.error(body.message || "登录已失效，请重新登录");
          location.href = "/login";
        } else {
          ElMessage.error(body.message || "请先登录");
        }
      } else {
        ElMessage.error(body.message || "请求失败");
      }
      return Promise.reject(body);
    }
    return response;
  },
  (error) => {
    ElMessage.error(error?.response?.data?.message || error?.message || "网络异常");
    return Promise.reject(error);
  }
);

export default request;
