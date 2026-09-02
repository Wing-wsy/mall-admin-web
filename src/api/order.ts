import request, { type ApiResult, type PageResult } from "@/utils/request";

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
  sellerMemberNo?: string;
  sellerLevelName?: string;
  orderNo: string;
  status: number;
  statusText: string;
  orderType?: number;
  supplierId?: number | null;
  supplierName?: string;
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
  commissionRate?: number | string;
  commissionAmount?: number | string;
  sellerIncome?: number | string;
  settleStatus?: number;
  settleStatusText?: string;
  shareUplineMemberNo?: string;
  shareRate?: number | string;
  shareListGoodsAmount?: number | string;
  shareSpread?: number | string;
  shareCommissionAmount?: number | string;
  shareIncome?: number | string;
  shareSettleStatus?: number;
  shareSettleStatusText?: string;
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
  afterSaleId?: number;
  afterSaleStatus?: number;
  afterSaleStatusText?: string;
  canDirectRefund?: boolean;
}

export function fetchAdminOrderList(params?: {
  status?: number;
  orderType?: number;
  orderNo?: string;
  supplierId?: number;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<PageResult<AdminOrderVO>>>("/api/admin/order/list", { params });
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
