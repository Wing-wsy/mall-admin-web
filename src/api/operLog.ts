import request, { type ApiResult } from "@/utils/request";

export interface OperLogVO {
  id: number;
  tenantId?: number;
  userId?: number;
  username?: string;
  nickname?: string;
  module?: string;
  action?: string;
  operType?: string;
  operTypeText?: string;
  method?: string;
  requestUri?: string;
  requestParams?: string;
  responseBody?: string;
  status: number;
  errorMsg?: string;
  ip?: string;
  costMs?: number;
  createTime?: string;
}

export interface OperLogPageVO {
  total: number;
  records: OperLogVO[];
}

export interface OperLogQuery {
  username?: string;
  module?: string;
  action?: string;
  operType?: string;
  status?: number;
  beginTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

export function fetchOperLogList(params?: OperLogQuery) {
  return request.get<ApiResult<OperLogPageVO>>("/api/admin/system/oper-log/list", { params });
}
