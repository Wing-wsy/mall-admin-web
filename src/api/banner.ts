import request, { type ApiResult } from "@/utils/request";

export interface BannerVO {
  id: number;
  title?: string;
  imageUrl: string;
  productId: number;
  productName?: string;
  sort: number;
  status: number;
}

export interface BannerSavePayload {
  title?: string;
  imageUrl: string;
  productId: number;
  sort?: number;
  status?: number;
}

export function fetchBannerList() {
  return request.get<ApiResult<BannerVO[]>>("/api/admin/banner/list");
}

export function createBanner(data: BannerSavePayload) {
  return request.post<ApiResult<BannerVO>>("/api/admin/banner", data);
}

export function updateBanner(id: number, data: BannerSavePayload) {
  return request.put<ApiResult<BannerVO>>(`/api/admin/banner/${id}`, data);
}

export function deleteBanner(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/banner/${id}`);
}
