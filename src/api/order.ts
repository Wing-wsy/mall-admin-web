import request, { type ApiResult } from "@/utils/request";

export interface AdminOrderItemVO {
  id: number;
  productId: number;
  skuId: number;
  productName: string;
  coverUrl?: string;
  specName?: string;
  price: number;
  quantity: number;
  amount: number;
}

export interface AdminOrderVO {
  id: number;
  memberNo?: string;
  orderNo: string;
  status: number;
  statusText: string;
  orderType?: number;
  goodsAmount: number;
  freightAmount: number;
  couponAmount?: number;
  couponName?: string;
  memberLevelName?: string;
  memberDiscount?: number;
  memberDiscountAmount?: number;
  pointsAmount?: number;
  voucherCodeId?: number;
  voucherCodeMask?: string;
  payAmount: number;
  payChannel?: string;
  payStatus?: number;
  payTime?: string;
  payTradeNo?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  buyerRemark?: string;
  cancelReason?: string;
  shipTime?: string;
  expressCompany?: string;
  expressCompanyName?: string;
  expressNo?: string;
  expressState?: number;
  finishTime?: string;
  cancelTime?: string;
  createTime?: string;
  items?: AdminOrderItemVO[];
}

export function fetchAdminOrderList(params?: { status?: number; orderType?: number; orderNo?: string }) {
  return request.get<ApiResult<AdminOrderVO[]>>("/api/admin/order/list", { params });
}

export function fetchAdminOrderDetail(id: number) {
  return request.get<ApiResult<AdminOrderVO>>(`/api/admin/order/${id}`);
}

export function shipAdminOrder(id: number, data: { expressCompany: string; expressNo: string }) {
  return request.post<ApiResult<AdminOrderVO>>(`/api/admin/order/${id}/ship`, data);
}

export function cancelAdminOrder(id: number, reason?: string) {
  return request.post<ApiResult<AdminOrderVO>>(`/api/admin/order/${id}/cancel`, { reason });
}

export interface AdminExpressTraceVO {
  time?: string;
  context?: string;
  location?: string;
}

export interface AdminExpressVO {
  expressCompany?: string;
  expressCompanyName?: string;
  expressNo?: string;
  expressState?: number;
  expressStateText?: string;
  traces?: AdminExpressTraceVO[];
}

export function fetchAdminOrderExpress(id: number) {
  return request.get<ApiResult<AdminExpressVO>>(`/api/admin/order/${id}/express`);
}
