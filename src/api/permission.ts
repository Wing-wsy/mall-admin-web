import request, { type ApiResult } from "@/utils/request";

export interface PermissionNode {
  id: number;
  parentId: number;
  name: string;
  code: string;
  type: number;
  path?: string | null;
  sort?: number;
  status?: number;
  children?: PermissionNode[];
}

export interface PermissionSavePayload {
  code?: string;
  name: string;
  type: number;
  parentId?: number;
  path?: string | null;
  sort?: number;
  status?: number;
}

export function fetchPermissionManageTree() {
  return request.get<ApiResult<PermissionNode[]>>("/api/admin/system/permission/tree", {
    params: { includeDisabled: true },
  });
}

export function createPermission(data: PermissionSavePayload) {
  return request.post<ApiResult<PermissionNode>>("/api/admin/system/permission", data);
}

export function updatePermission(id: number, data: PermissionSavePayload) {
  return request.put<ApiResult<PermissionNode>>(`/api/admin/system/permission/${id}`, data);
}

export function updatePermissionStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/system/permission/${id}/status`, { status });
}

export function deletePermission(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/system/permission/${id}`);
}
