import request, { type ApiResult } from "@/utils/request";
import type { MenuNode } from "@/stores/user";

export interface AdminLoginResult {
  token: string;
  userId: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  tenantId: number;
  tenantType: number;
  tenantName?: string;
  roles: string[];
  userType?: number;
  permissions: string[];
  menus: MenuNode[];
}

export function loginAdmin(username: string, password: string) {
  return request.post<ApiResult<AdminLoginResult>>(
    "/api/admin/auth/login",
    { username, password },
    { skipAuth: true }
  );
}

export function logoutAdmin() {
  return request.post<ApiResult<null>>("/api/admin/auth/logout");
}

export function fetchAdminMe() {
  return request.get<ApiResult<AdminLoginResult>>("/api/admin/auth/me");
}

export function updateAdminProfile(payload: { nickname?: string; avatarUrl?: string }) {
  return request.put<ApiResult<AdminLoginResult>>("/api/admin/auth/profile", payload);
}

export function changeAdminPassword(payload: { oldPassword: string; newPassword: string }) {
  return request.post<ApiResult<null>>("/api/admin/auth/change-password", payload);
}

export function verifyAdminPassword(password: string) {
  return request.post<ApiResult<null>>(
    "/api/admin/auth/verify-password",
    { password },
    { skipErrorMessage: true }
  );
}
