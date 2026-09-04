import request, { type ApiResult } from "@/utils/request";
import type { PageResult } from "@/types/page";

export interface ComboItemVO {
  id?: number;
  productId: number;
  skuId: number;
  productName?: string;
  coverUrl?: string;
  specName?: string;
  skuPrice?: number;
  quantity: number;
  sort?: number;
  productStatus?: number;
  skuStatus?: number;
  stock?: number;
}

export interface ComboVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  detailImageUrls?: string[];
  price: number;
  originPrice?: number;
  detailHtml?: string;
  freightQty?: number;
  status: number;
  sort: number;
  itemCount?: number;
  items?: ComboItemVO[];
  createTime?: string;
  updateTime?: string;
}

export interface ComboItemPayload {
  productId: number;
  skuId: number;
  quantity: number;
  sort?: number;
}

export interface ComboSavePayload {
  name: string;
  subtitle?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  detailImageUrls?: string[];
  price: number;
  originPrice?: number;
  detailHtml?: string;
  freightQty?: number;
  status?: number;
  sort?: number;
  items: ComboItemPayload[];
}

export interface ComboQuery {
  name?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export function fetchComboList(params?: ComboQuery) {
  return request.get<ApiResult<PageResult<ComboVO>>>("/api/admin/combo/list", { params });
}

export function fetchComboDetail(id: number) {
  return request.get<ApiResult<ComboVO>>(`/api/admin/combo/${id}`);
}

export function createCombo(data: ComboSavePayload) {
  return request.post<ApiResult<ComboVO>>("/api/admin/combo", data);
}

export function updateCombo(id: number, data: ComboSavePayload) {
  return request.put<ApiResult<ComboVO>>(`/api/admin/combo/${id}`, data);
}

export function updateComboStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/combo/${id}/status`, { status });
}
