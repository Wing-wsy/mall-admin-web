import request, { type ApiResult } from "@/utils/request";

export interface AdminVoucherTemplateVO {
  id: number;
  name: string;
  coverUrl?: string;
  redeemProductId: number;
  redeemProductName?: string;
  redeemSkuId: number;
  redeemSkuName?: string;
  redeemStock?: number;
  cardProductId?: number | null;
  cardProductName?: string | null;
  validStart?: string | null;
  validEnd?: string | null;
  unusedCount?: number;
  usedCount?: number;
  voidedCount?: number;
  status: number;
  createTime?: string;
  updateTime?: string;
}

export interface VoucherTemplateSavePayload {
  name: string;
  coverUrl?: string | null;
  redeemProductId: number;
  redeemSkuId: number;
  cardProductId?: number | null;
  validStart?: string | null;
  validEnd?: string | null;
  status?: number;
}

export interface AdminVoucherCodeVO {
  id: number;
  templateId: number;
  templateName?: string;
  batchNo: string;
  codeMask: string;
  status: number;
  statusText: string;
  memberNo?: string;
  redeemedOrderId?: number;
  orderNo?: string;
  redeemedAt?: string;
  createTime?: string;
}

export interface GeneratedVoucherCode {
  seq: number;
  code: string;
}

export interface VoucherGenerateVO {
  batchNo: string;
  count: number;
  codes: GeneratedVoucherCode[];
}

export function fetchVoucherTemplates() {
  return request.get<ApiResult<AdminVoucherTemplateVO[]>>("/api/admin/voucher/template/list");
}

export function createVoucherTemplate(data: VoucherTemplateSavePayload) {
  return request.post<ApiResult<AdminVoucherTemplateVO>>("/api/admin/voucher/template", data);
}

export function updateVoucherTemplate(id: number, data: VoucherTemplateSavePayload) {
  return request.put<ApiResult<AdminVoucherTemplateVO>>(`/api/admin/voucher/template/${id}`, data);
}

export function updateVoucherTemplateStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/voucher/template/${id}/status`, { status });
}

export function deleteVoucherTemplate(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/voucher/template/${id}`);
}

export function generateVoucherCodes(id: number, count: number) {
  return request.post<ApiResult<VoucherGenerateVO>>(`/api/admin/voucher/template/${id}/generate`, { count });
}

export function fetchVoucherCodes(params?: {
  templateId?: number;
  batchNo?: string;
  status?: number;
  memberNo?: string;
  code?: string;
}) {
  return request.get<ApiResult<AdminVoucherCodeVO[]>>("/api/admin/voucher/code/list", { params });
}

export function voidVoucherCode(id: number) {
  return request.put<ApiResult<null>>(`/api/admin/voucher/code/${id}/void`);
}

export function voidVoucherBatch(batchNo: string) {
  return request.post<ApiResult<number>>("/api/admin/voucher/code/void-batch", { batchNo });
}
