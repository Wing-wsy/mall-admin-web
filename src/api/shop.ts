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

export interface FreightRuleVO {
  provinces: string[];
  firstQty: number;
  firstFee: number;
  extraQty: number;
  extraFee: number;
}

export interface FreightTemplateVO {
  enabled: boolean;
  freeThreshold?: number | null;
  defaultRule: FreightRuleVO;
  regionRules: FreightRuleVO[];
  provinceOptions: string[];
}

export interface FreightSavePayload {
  enabled: boolean;
  freeThreshold?: number | null;
  defaultRule: FreightRuleVO;
  regionRules: FreightRuleVO[];
}

export function fetchShopConfig() {
  return request.get<ApiResult<ShopConfigVO>>("/api/admin/shop/config");
}

export function saveShopConfig(data: ShopConfigSavePayload) {
  return request.put<ApiResult<ShopConfigVO>>("/api/admin/shop/config", data);
}

export function fetchFreightTemplate() {
  return request.get<ApiResult<FreightTemplateVO>>("/api/admin/shop/freight");
}

export function saveFreightTemplate(data: FreightSavePayload) {
  return request.put<ApiResult<FreightTemplateVO>>("/api/admin/shop/freight", data);
}
