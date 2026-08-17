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
  goodsAmount: number;
  freightAmount: number;
  couponAmount?: number;
  couponName?: string;
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

export function fetchAdminOrderList(params?: { status?: number; orderNo?: string }) {
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
