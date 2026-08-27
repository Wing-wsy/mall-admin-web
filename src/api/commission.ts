import request, { type ApiResult } from "@/utils/request";

export interface AdminCommissionVO {
  orderId: number;
  orderNo: string;
  buyerMemberNo?: string;
  sellerMemberNo?: string;
  sellerLevelName?: string;
  supplierId?: number | null;
  supplierName?: string;
  payAmount: number | string;
  commissionRate?: number | string;
  commissionAmount?: number | string;
  sellerIncome?: number | string;
  settleStatus?: number;
  settleStatusText?: string;
  orderStatus?: number;
  orderStatusText?: string;
  finishTime?: string;
  createTime?: string;
}

export function fetchAdminCommissionList(params?: {
  orderNo?: string;
  sellerMemberNo?: string;
  settleStatus?: number;
}) {
  return request.get<ApiResult<AdminCommissionVO[]>>("/api/admin/commission/list", { params });
}
