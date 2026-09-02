import request, { type ApiResult, type PageResult } from "@/utils/request";

export interface AdminMemberLevelVO {
  id: number;
  name: string;
  iconUrl?: string;
  discount: number | string;
  couponStackMode: "STACK" | "MUTEX";
  couponStackModeText?: string;
  privileges?: string[];
  privilegesText?: string;
  supplierMax?: number;
  productMax?: number;
  commissionRate?: number | string;
  shareCommissionRate?: number | string;
  shareRateMin?: number | string;
  shareRateMax?: number | string;
  sort?: number;
  status: number;
  phoneCount?: number;
  createTime?: string;
  updateTime?: string;
}

export interface MemberLevelSavePayload {
  name: string;
  iconUrl?: string | null;
  discount: number;
  couponStackMode: "STACK" | "MUTEX";
  sort?: number;
  status?: number;
  privileges?: string[];
  supplierMax?: number;
  productMax?: number;
  commissionRate?: number;
  shareCommissionRate?: number;
  shareRateMin?: number;
  shareRateMax?: number;
}

export interface AdminMemberLevelPhoneVO {
  id: number;
  phone: string;
  levelId: number;
  levelName?: string;
  memberNo?: string;
  createTime?: string;
}

export function fetchMemberLevels(params?: { pageNum?: number; pageSize?: number }) {
  return request.get<ApiResult<PageResult<AdminMemberLevelVO>>>("/api/admin/member-level/list", { params });
}

export function createMemberLevel(data: MemberLevelSavePayload) {
  return request.post<ApiResult<AdminMemberLevelVO>>("/api/admin/member-level", data);
}

export function updateMemberLevel(id: number, data: MemberLevelSavePayload) {
  return request.put<ApiResult<AdminMemberLevelVO>>(`/api/admin/member-level/${id}`, data);
}

export function updateMemberLevelStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/member-level/${id}/status`, { status });
}

export function deleteMemberLevel(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/member-level/${id}`);
}

export function fetchMemberLevelPhones(params?: {
  phone?: string;
  levelId?: number;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<PageResult<AdminMemberLevelPhoneVO>>>("/api/admin/member-level/phone/list", { params });
}

export function createMemberLevelPhone(data: { phone: string; levelId: number }) {
  return request.post<ApiResult<AdminMemberLevelPhoneVO>>("/api/admin/member-level/phone", data);
}

export function batchCreateMemberLevelPhones(data: { phones: string; levelId: number }) {
  return request.post<ApiResult<number>>("/api/admin/member-level/phone/batch", data);
}

export function updateMemberLevelPhone(id: number, data: { phone: string; levelId: number }) {
  return request.put<ApiResult<AdminMemberLevelPhoneVO>>(`/api/admin/member-level/phone/${id}`, data);
}

export function deleteMemberLevelPhone(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/member-level/phone/${id}`);
}

export interface AdminMemberLevelInviteVO {
  id: number;
  levelId: number;
  levelName?: string;
  code: string;
  expireAt: string;
  status: number;
  statusText?: string;
  urlLink?: string;
  miniPath?: string;
  envVersion?: string;
  remark?: string;
  maxUses?: number;
  redeemCount?: number;
  createTime?: string;
}

export interface AdminMemberLevelInviteLogVO {
  id: number;
  phone: string;
  memberNo?: string;
  fromLevelName?: string;
  toLevelName?: string;
  createTime?: string;
}

export function fetchMemberLevelInvites(params?: {
  levelId?: number;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<PageResult<AdminMemberLevelInviteVO>>>("/api/admin/member-level/invite/list", {
    params,
  });
}

export function createMemberLevelInvite(data: {
  levelId: number;
  expireAt: string;
  maxUses: number;
  envVersion?: string;
  remark?: string;
}) {
  return request.post<ApiResult<AdminMemberLevelInviteVO>>("/api/admin/member-level/invite", data);
}

export function revokeMemberLevelInvite(id: number) {
  return request.put<ApiResult<null>>(`/api/admin/member-level/invite/${id}/revoke`);
}

export function fetchMemberLevelInviteLogs(id: number) {
  return request.get<ApiResult<AdminMemberLevelInviteLogVO[]>>(`/api/admin/member-level/invite/${id}/logs`);
}
