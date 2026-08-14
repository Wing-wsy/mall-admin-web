import request, { type ApiResult } from "@/utils/request";

export interface HotProductVO {
  id: number;
  productId: number;
  productName?: string;
  coverUrl?: string;
  price?: number;
  originPrice?: number;
  productStatus?: number;
  sort: number;
  status: number;
}

export interface HotProductSavePayload {
  productId: number;
  sort?: number;
  status?: number;
}

export function fetchHotProductList() {
  return request.get<ApiResult<HotProductVO[]>>("/api/admin/hot-product/list");
}

export function createHotProduct(data: HotProductSavePayload) {
  return request.post<ApiResult<HotProductVO>>("/api/admin/hot-product", data);
}

export function updateHotProduct(id: number, data: HotProductSavePayload) {
  return request.put<ApiResult<HotProductVO>>(`/api/admin/hot-product/${id}`, data);
}

export function deleteHotProduct(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/hot-product/${id}`);
}
