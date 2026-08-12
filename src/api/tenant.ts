import request, { type ApiResult } from "@/utils/request";

export interface TenantVO {
  id: number;
  code: string;
  name: string;
  type: number;
  contactName?: string;
  contactPhone?: string;
  status: number;
}

export function fetchTenantList() {
  return request.get<ApiResult<TenantVO[]>>("/api/admin/system/tenant/list");
}

export function createTenant(data: Partial<TenantVO> & { code: string; name: string }) {
  return request.post<ApiResult<TenantVO>>("/api/admin/system/tenant", data);
}

export function updateTenant(id: number, data: Partial<TenantVO> & { code: string; name: string }) {
  return request.put<ApiResult<TenantVO>>(`/api/admin/system/tenant/${id}`, data);
}

export function updateTenantStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/system/tenant/${id}/status`, { status });
}
