import request, { type ApiResult } from "@/utils/request";

export interface PingData {
  service: string;
  status: string;
}

export function pingAdminApi() {
  return request.get<ApiResult<PingData>>("/ping");
}
