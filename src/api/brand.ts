import request, { type ApiResult } from "@/utils/request";
import type { PageResult } from "@/types/page";

export interface BrandVO {
  id: number;
  name: string;
  sort: number;
  status: number;
}

export interface BrandOptionVO {
  id: number;
  name: string;
}

export interface BrandSavePayload {
  name: string;
  sort?: number;
  status?: number;
}

export interface BrandQuery {
  pageNum?: number;
  pageSize?: number;
}

export function fetchBrandList(params?: BrandQuery) {
  return request.get<ApiResult<PageResult<BrandVO>>>("/api/admin/brand/list", { params });
}

export function fetchBrandOptions() {
  return request.get<ApiResult<BrandOptionVO[]>>("/api/admin/brand/options");
}

export function createBrand(data: BrandSavePayload) {
  return request.post<ApiResult<BrandVO>>("/api/admin/brand", data);
}

export function updateBrand(id: number, data: BrandSavePayload) {
  return request.put<ApiResult<BrandVO>>(`/api/admin/brand/${id}`, data);
}

export function updateBrandStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/brand/${id}/status`, { status });
}

export function deleteBrand(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/brand/${id}`);
}
