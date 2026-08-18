import request, { type ApiResult } from "@/utils/request";

export interface AdminPointProductVO {
  id: number;
  productId: number;
  productName?: string;
  coverUrl?: string;
  baseSpecName?: string;
  points: number;
  sort: number;
  status: number;
  createTime?: string;
  updateTime?: string;
}

export interface PointProductSavePayload {
  productId: number;
  points: number;
  sort?: number;
  status?: number;
}

export interface AdminPointLogVO {
  id: number;
  memberNo?: string;
  changeQty: number;
  afterQty: number;
  bizType: string;
  bizTypeText: string;
  orderId?: number;
  remark?: string;
  createTime?: string;
}

export function fetchPointProductList() {
  return request.get<ApiResult<AdminPointProductVO[]>>("/api/admin/point/product/list");
}

export function createPointProduct(data: PointProductSavePayload) {
  return request.post<ApiResult<AdminPointProductVO>>("/api/admin/point/product", data);
}

export function updatePointProduct(id: number, data: PointProductSavePayload) {
  return request.put<ApiResult<AdminPointProductVO>>(`/api/admin/point/product/${id}`, data);
}

export function updatePointProductStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/point/product/${id}/status`, { status });
}

export function fetchPointLogs(params?: { memberNo?: string }) {
  return request.get<ApiResult<AdminPointLogVO[]>>("/api/admin/point/log", { params });
}
