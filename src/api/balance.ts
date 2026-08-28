import request, { type ApiResult } from "@/utils/request";

export interface AdminBalanceLogVO {
  id: number;
  memberNo?: string;
  nickname?: string;
  changeAmount: number | string;
  afterAmount: number | string;
  bizType?: string;
  bizTypeText?: string;
  orderId?: number;
  orderNo?: string;
  remark?: string;
  createTime?: string;
}

export interface AdminBalanceAccountVO {
  memberNo?: string;
  nickname?: string;
  phone?: string;
  balance?: number | string;
  list?: AdminBalanceLogVO[];
}

export function fetchAdminBalanceLogs(params: {
  memberNo: string;
  orderNo?: string;
  bizType?: string;
}) {
  return request.get<ApiResult<AdminBalanceAccountVO>>("/api/admin/balance/logs", { params });
}
