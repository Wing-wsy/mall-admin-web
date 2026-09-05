import request, { type ApiResult } from "@/utils/request";
import type { PageResult } from "@/types/page";

export interface SaleAttrValueVO {
  id?: number;
  valueName: string;
  sort?: number;
  status?: number;
}

export interface SaleAttrVO {
  id: number;
  name: string;
  sort: number;
  status: number;
  values?: SaleAttrValueVO[];
}

export interface SaleAttrSavePayload {
  name: string;
  sort?: number;
  status?: number;
  values: SaleAttrValueVO[];
}

export interface SaleAttrQuery {
  pageNum?: number;
  pageSize?: number;
}

export function fetchSaleAttrList(params?: SaleAttrQuery) {
  return request.get<ApiResult<PageResult<SaleAttrVO>>>("/api/admin/sale-attr/list", { params });
}

export function createSaleAttr(data: SaleAttrSavePayload) {
  return request.post<ApiResult<SaleAttrVO>>("/api/admin/sale-attr", data);
}

export function updateSaleAttr(id: number, data: SaleAttrSavePayload) {
  return request.put<ApiResult<SaleAttrVO>>(`/api/admin/sale-attr/${id}`, data);
}

export function updateSaleAttrStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/sale-attr/${id}/status`, { status });
}

export function deleteSaleAttr(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/sale-attr/${id}`);
}
