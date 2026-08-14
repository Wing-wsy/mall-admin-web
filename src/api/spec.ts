import request, { type ApiResult } from "@/utils/request";

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

export function fetchSpecList() {
  return request.get<ApiResult<SpecVO[]>>("/api/admin/spec/list");
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
