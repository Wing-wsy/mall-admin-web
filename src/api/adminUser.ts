import request, { type ApiResult } from "@/utils/request";
import type { PageResult } from "@/types/page";

export interface AdminUserVO {
  id: number;
  tenantId: number;
  username: string;
  nickname?: string;
  status: number;
  roleIds: number[];
  roleNames: string[];
}

export interface AdminUserQuery {
  username?: string;
  nickname?: string;
  roleId?: number;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export function fetchAdminUserList(params?: AdminUserQuery) {
  return request.get<ApiResult<PageResult<AdminUserVO>>>("/api/admin/system/user/list", { params });
}

export function createAdminUser(data: {
  username: string;
  password: string;
  nickname?: string;
  status?: number;
  roleIds: number[];
}) {
  return request.post<ApiResult<AdminUserVO>>("/api/admin/system/user", data);
}

export function updateAdminUser(
  id: number,
  data: { username: string; nickname?: string; status?: number; roleIds: number[] }
) {
  return request.put<ApiResult<AdminUserVO>>(`/api/admin/system/user/${id}`, data);
}

export function updateAdminUserStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/system/user/${id}/status`, { status });
}

export function resetAdminUserPassword(id: number, password: string) {
  return request.put<ApiResult<null>>(`/api/admin/system/user/${id}/password`, { password });
}
