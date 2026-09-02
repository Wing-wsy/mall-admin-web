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
  total?: number;
  records?: AdminBalanceLogVO[];
}

export function fetchAdminBalanceLogs(params: {
  memberNo: string;
  orderNo?: string;
  bizType?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<AdminBalanceAccountVO>>("/api/admin/balance/logs", { params });
}
