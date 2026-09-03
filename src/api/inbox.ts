import request, { type ApiResult } from "@/utils/request";
import type { PageResult } from "@/types/page";

export interface AdminMessage {
  id: number;
  bizType: string;
  bizTypeLabel?: string;
  bizId?: number;
  title: string;
  content?: string;
  linkPath?: string;
  read?: boolean;
  createTime?: string;
}

export function fetchInboxUnreadCount() {
  return request.get<ApiResult<{ count: number }>>("/api/admin/inbox/unread-count");
}

export function fetchInboxList(params: {
  unreadOnly?: boolean;
  pageNum?: number;
  pageSize?: number;
}) {
  return request.get<ApiResult<PageResult<AdminMessage>>>("/api/admin/inbox/list", { params });
}

export function markInboxRead(id: number) {
  return request.post<ApiResult<null>>(`/api/admin/inbox/${id}/read`);
}

export function markInboxAllRead() {
  return request.post<ApiResult<null>>("/api/admin/inbox/read-all");
}
