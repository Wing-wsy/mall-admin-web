import request, { type ApiResult } from "@/utils/request";
import type { MenuNode } from "@/stores/user";

export interface AdminLoginResult {
  token: string;
  userId: number;
  username: string;
  nickname?: string;
  tenantId: number;
  tenantType: number;
  tenantName?: string;
  roles: string[];
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
