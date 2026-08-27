import request, { type ApiResult } from "@/utils/request";
import type { AdminOrderItemVO } from "@/api/order";

export interface AdminAfterSaleLogVO {
  action?: string;
  actionText?: string;
  fromStatus?: number;
  toStatus?: number;
  toStatusText?: string;
  remark?: string;
  operatorType?: string;
  createTime?: string;
}

export interface AdminAfterSaleVO {
  id: number;
  orderId: number;
  orderNo?: string;
  memberNo?: string;
  orderType?: number;
  orderStatus?: number;
  orderStatusText?: string;
  afterSaleNo: string;
  type: number;
  typeText?: string;
  status: number;
  statusText?: string;
  reason?: string;
  reasonText?: string;
  remark?: string;
  images?: string[];
  refundAmount?: number;
  refundPoints?: number;
  rejectReason?: string;
  returnExpressCompany?: string;
  returnExpressCompanyName?: string;
  returnExpressNo?: string;
  returnName?: string;
  returnPhone?: string;
  returnAddress?: string;
  returnTime?: string;
  receiveTime?: string;
  refundTime?: string;
  auditTime?: string;
  createTime?: string;
  items?: AdminOrderItemVO[];
  logs?: AdminAfterSaleLogVO[];
  canApprove?: boolean;
  canReject?: boolean;
  canReceive?: boolean;
}

export function fetchAfterSaleList(params?: {
  status?: number;
  type?: number;
  orderNo?: string;
  afterSaleNo?: string;
}) {
  return request.get<ApiResult<AdminAfterSaleVO[]>>("/api/admin/after-sale/list", { params });
}

export function fetchAfterSaleDetail(id: number) {
  return request.get<ApiResult<AdminAfterSaleVO>>(`/api/admin/after-sale/${id}`);
}

export function approveAfterSale(id: number, type?: number) {
  return request.post<ApiResult<AdminAfterSaleVO>>(`/api/admin/after-sale/${id}/approve`, { type });
}

export function rejectAfterSale(id: number, reason: string) {
  return request.post<ApiResult<AdminAfterSaleVO>>(`/api/admin/after-sale/${id}/reject`, { reason });
}

export function receiveAfterSale(id: number) {
  return request.post<ApiResult<AdminAfterSaleVO>>(`/api/admin/after-sale/${id}/receive`);
}

export interface AfterSaleReasonVO {
  id: number;
  scene?: string;
  code: string;
  label: string;
  sort?: number;
  status?: number;
}

export interface AfterSaleReasonSavePayload {
  label: string;
  sort?: number;
  status?: number;
}

export function fetchDirectRefundReasonList() {
  return request.get<ApiResult<AfterSaleReasonVO[]>>("/api/admin/after-sale/direct-reason/list");
}

export function fetchDirectRefundReasonOptions() {
  return request.get<ApiResult<AfterSaleReasonVO[]>>("/api/admin/after-sale/direct-reason/options");
}

export function createDirectRefundReason(data: AfterSaleReasonSavePayload) {
  return request.post<ApiResult<AfterSaleReasonVO>>("/api/admin/after-sale/direct-reason", data);
}

export function updateDirectRefundReason(id: number, data: AfterSaleReasonSavePayload) {
  return request.put<ApiResult<AfterSaleReasonVO>>(`/api/admin/after-sale/direct-reason/${id}`, data);
}

export function updateDirectRefundReasonStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/after-sale/direct-reason/${id}/status`, { status });
}

export function deleteDirectRefundReason(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/after-sale/direct-reason/${id}`);
}

export function directRefund(orderId: number, reasonCode: string) {
  return request.post<ApiResult<AdminAfterSaleVO>>("/api/admin/after-sale/direct", { orderId, reasonCode });
}
