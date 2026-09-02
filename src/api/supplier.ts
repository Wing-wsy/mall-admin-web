import request, { type ApiResult } from "@/utils/request";
import type { PageResult } from "@/types/page";

export interface AdminSupplierVO {
  id: number;
  memberId: number;
  memberNo?: string;
  phone?: string;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  status: number;
  statusText?: string;
  auditRemark?: string;
  auditTime?: string;
  createTime?: string;
  updateTime?: string;
}

export interface AdminSupplierSettingVO {
  adminLoginUrl?: string;
}

export interface SupplierQuery {
  name?: string;
  phone?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export function fetchSupplierList(params?: SupplierQuery) {
  return request.get<ApiResult<PageResult<AdminSupplierVO>>>("/api/admin/supplier/list", { params });
}

export function fetchSupplierOptions() {
  return request.get<ApiResult<AdminSupplierVO[]>>("/api/admin/supplier/options");
}

export function fetchSupplierDetail(id: number) {
  return request.get<ApiResult<AdminSupplierVO>>(`/api/admin/supplier/${id}`);
}

export function fetchSupplierSetting() {
  return request.get<ApiResult<AdminSupplierSettingVO>>("/api/admin/supplier/setting");
}

export function updateSupplierSetting(data: AdminSupplierSettingVO) {
  return request.put<ApiResult<AdminSupplierSettingVO>>("/api/admin/supplier/setting", data);
}

export function createSupplier(data: {
  phone?: string;
  memberId?: number;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  status?: number;
}) {
  return request.post<ApiResult<AdminSupplierVO>>("/api/admin/supplier", data);
}

export function updateSupplier(
  id: number,
  data: { name: string; contact: string; email?: string; address?: string }
) {
  return request.put<ApiResult<AdminSupplierVO>>(`/api/admin/supplier/${id}`, data);
}

export function approveSupplier(id: number, remark?: string) {
  return request.post<ApiResult<AdminSupplierVO>>(`/api/admin/supplier/${id}/approve`, { remark });
}

export function rejectSupplier(id: number, remark?: string) {
  return request.post<ApiResult<AdminSupplierVO>>(`/api/admin/supplier/${id}/reject`, { remark });
}

export function resetSupplierPassword(id: number) {
  return request.post<ApiResult<{ password: string }>>(`/api/admin/supplier/${id}/reset-password`);
}

export function deleteSupplier(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/supplier/${id}`);
}
