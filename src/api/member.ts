import request, { type ApiResult } from "@/utils/request";

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
  status: number;
  createTime?: string;
  addressCount?: number;
  addresses?: AdminMemberAddressVO[];
}

export function fetchAdminMemberList(params?: { memberNo?: string; nickname?: string; phone?: string }) {
  return request.get<ApiResult<AdminMemberVO[]>>("/api/admin/member/list", { params });
}

export function fetchAdminMemberDetail(memberNo: string) {
  return request.get<ApiResult<AdminMemberVO>>(`/api/admin/member/${memberNo}`);
}
