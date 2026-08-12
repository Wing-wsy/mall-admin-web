import request, { type ApiResult } from "@/utils/request";

export interface RoleVO {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  remark?: string;
  status: number;
  permissionIds: number[];
}

export interface PermissionNode {
  id: number;
  parentId: number;
  name: string;
  code: string;
  type: number;
  path?: string;
  children?: PermissionNode[];
}

export function fetchRoleList() {
  return request.get<ApiResult<RoleVO[]>>("/api/admin/system/role/list");
}

export function createRole(data: {
  code: string;
  name: string;
  remark?: string;
  status?: number;
  permissionIds?: number[];
}) {
  return request.post<ApiResult<RoleVO>>("/api/admin/system/role", data);
}

export function updateRole(
  id: number,
  data: { code: string; name: string; remark?: string; status?: number; permissionIds?: number[] }
) {
  return request.put<ApiResult<RoleVO>>(`/api/admin/system/role/${id}`, data);
}

export function deleteRole(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/system/role/${id}`);
}

export function assignRolePermissions(id: number, permissionIds: number[]) {
  return request.put<ApiResult<null>>(`/api/admin/system/role/${id}/permissions`, { permissionIds });
}

export function fetchPermissionTree() {
  return request.get<ApiResult<PermissionNode[]>>("/api/admin/system/permission/tree");
}
