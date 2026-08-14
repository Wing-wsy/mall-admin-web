import request, { type ApiResult } from "@/utils/request";

export interface NavEntryVO {
  id: number;
  title: string;
  iconUrl?: string;
  linkType: string;
  linkValue?: string;
  linkLabel?: string;
  sort: number;
  status: number;
}

export interface NavEntrySavePayload {
  title: string;
  iconUrl?: string;
  linkType: string;
  linkValue?: string;
  sort?: number;
  status?: number;
}

export function fetchNavEntryList() {
  return request.get<ApiResult<NavEntryVO[]>>("/api/admin/nav-entry/list");
}

export function createNavEntry(data: NavEntrySavePayload) {
  return request.post<ApiResult<NavEntryVO>>("/api/admin/nav-entry", data);
}

export function updateNavEntry(id: number, data: NavEntrySavePayload) {
  return request.put<ApiResult<NavEntryVO>>(`/api/admin/nav-entry/${id}`, data);
}

export function deleteNavEntry(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/nav-entry/${id}`);
}
