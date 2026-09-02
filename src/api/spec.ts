import request, { type ApiResult } from "@/utils/request";
import type { PageResult } from "@/types/page";

export interface SpecVO {
  id: number;
  name: string;
  sort: number;
  status: number;
}

export interface SpecSavePayload {
  name: string;
  sort?: number;
  status?: number;
}

export interface SpecQuery {
  pageNum?: number;
  pageSize?: number;
}

export function fetchSpecList(params?: SpecQuery) {
  return request.get<ApiResult<PageResult<SpecVO>>>("/api/admin/spec/list", { params });
}

export function createSpec(data: SpecSavePayload) {
  return request.post<ApiResult<SpecVO>>("/api/admin/spec", data);
}

export function updateSpec(id: number, data: SpecSavePayload) {
  return request.put<ApiResult<SpecVO>>(`/api/admin/spec/${id}`, data);
}

export function updateSpecStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/spec/${id}/status`, { status });
}

export function deleteSpec(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/spec/${id}`);
}
