import request, { type ApiResult } from "@/utils/request";

export interface ShopConfigVO {
  csPhone: string;
  csEmail: string;
  notice: string;
}

export interface ShopConfigSavePayload {
  csPhone?: string;
  csEmail?: string;
  notice?: string;
}

export function fetchShopConfig() {
  return request.get<ApiResult<ShopConfigVO>>("/api/admin/shop/config");
}

export function saveShopConfig(data: ShopConfigSavePayload) {
  return request.put<ApiResult<ShopConfigVO>>("/api/admin/shop/config", data);
}
