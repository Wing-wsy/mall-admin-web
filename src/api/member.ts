import request, { type ApiResult, type PageResult } from "@/utils/request";

export interface AdminMemberAddressVO {
  id: number;
  receiverName: string;
  receiverPhone: string;
  province?: string;
  city?: string;
  district?: string;
  detailAddress?: string;
  fullAddress: string;
  isDefault: boolean;
}

export interface AdminMemberVO {
  memberNo: string;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
  levelName?: string;
  points?: number;
  balance?: number | string;
  status: number;
  createTime?: string;
  addressCount?: number;
  uplineMemberNo?: string;
  downlineCount?: number;
  addresses?: AdminMemberAddressVO[];
  downlines?: { memberNo?: string; nickname?: string; phone?: string; createTime?: string }[];
}

export function fetchAdminMemberList(params?: {
  memberNo?: string;
  nickname?: string;
  phone?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<PageResult<AdminMemberVO>>>("/api/admin/member/list", { params });
}

export function fetchAdminMemberDetail(memberNo: string) {
  return request.get<ApiResult<AdminMemberVO>>(`/api/admin/member/${memberNo}`);
}
