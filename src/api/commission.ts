import request, { type ApiResult, type PageResult } from "@/utils/request";

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
  kind?: string;
  uplineMemberNo?: string;
  shareRate?: number | string;
  shareListGoodsAmount?: number | string;
  shareSpread?: number | string;
  shareCommissionAmount?: number | string;
  shareIncome?: number | string;
  shareSettleStatus?: number;
  shareSettleStatusText?: string;
  orderStatus?: number;
  orderStatusText?: string;
  finishTime?: string;
  createTime?: string;
}

export function fetchAdminCommissionList(params?: {
  orderNo?: string;
  sellerMemberNo?: string;
  settleStatus?: number;
  kind?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<PageResult<AdminCommissionVO>>>("/api/admin/commission/list", { params });
}
