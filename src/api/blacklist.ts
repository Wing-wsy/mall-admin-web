import request, { type ApiResult, type PageResult } from "@/utils/request";

export interface MemberBlacklistReasonVO {
  code: string;
  label: string;
}

export interface AdminMemberBlacklistVO {
  id: number;
  phone: string;
  reasonCode: string;
  reasonLabel?: string;
  memberNo?: string;
  operatorId?: number;
  createTime?: string;
}

export function fetchBlacklistReasons() {
  return request.get<ApiResult<MemberBlacklistReasonVO[]>>("/api/admin/blacklist/phone/reasons");
}

export function fetchBlacklistPhones(params?: {
  phone?: string;
  reasonCode?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<PageResult<AdminMemberBlacklistVO>>>("/api/admin/blacklist/phone/list", { params });
}

export function createBlacklistPhone(data: { phone: string; reasonCode: string }) {
  return request.post<ApiResult<AdminMemberBlacklistVO>>("/api/admin/blacklist/phone", data);
}

export function deleteBlacklistPhone(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/blacklist/phone/${id}`);
}
