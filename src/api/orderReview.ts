import request, { type ApiResult, type PageResult } from "@/utils/request";

export interface AdminOrderReviewVO {
  id: number;
  orderId: number;
  orderNo?: string;
  memberId?: number;
  memberNo?: string;
  rating: number;
  content?: string;
  images?: string[];
  status?: number;
  createTime?: string;
}

export function fetchOrderReviewList(params?: {
  orderNo?: string;
  memberId?: number;
  rating?: number;
  beginTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<PageResult<AdminOrderReviewVO>>>("/api/admin/order-review/list", { params });
}
