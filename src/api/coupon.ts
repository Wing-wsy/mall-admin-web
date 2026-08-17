import request, { type ApiResult } from "@/utils/request";

export interface AdminCouponTemplateVO {
  id: number;
  name: string;
  issueType: string;
  issueTypeText: string;
  benefitType: string;
  benefitText: string;
  thresholdAmount: number;
  benefitValue: number;
  validDays: number;
  claimStart?: string;
  claimEnd?: string;
  totalQuota?: number | null;
  issuedCount: number;
  status: number;
  createTime?: string;
}

export interface CouponTemplateSavePayload {
  name: string;
  issueType: string;
  benefitType?: string;
  thresholdAmount?: number;
  benefitValue: number;
  validDays: number;
  claimStart?: string | null;
  claimEnd?: string | null;
  totalQuota?: number | null;
  status?: number;
}

export interface AdminCouponVO {
  id: number;
  couponNo: string;
  templateId: number;
  memberNo?: string;
  nickname?: string;
  name: string;
  benefitText: string;
  source: string;
  status: number;
  statusText: string;
  expireTime?: string;
  createTime?: string;
}

export function fetchCouponTemplates() {
  return request.get<ApiResult<AdminCouponTemplateVO[]>>("/api/admin/coupon/template/list");
}

export function createCouponTemplate(data: CouponTemplateSavePayload) {
  return request.post<ApiResult<AdminCouponTemplateVO>>("/api/admin/coupon/template", data);
}

export function updateCouponTemplate(id: number, data: CouponTemplateSavePayload) {
  return request.put<ApiResult<AdminCouponTemplateVO>>(`/api/admin/coupon/template/${id}`, data);
}

export function updateCouponTemplateStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/coupon/template/${id}/status`, { status });
}

export function fetchCouponRecords(params?: { couponNo?: string; memberNo?: string; status?: number }) {
  return request.get<ApiResult<AdminCouponVO[]>>("/api/admin/coupon/list", { params });
}

export function issueCoupons(data: { templateId: number; memberNos: string[] }) {
  return request.post<ApiResult<number>>("/api/admin/coupon/issue", data);
}
