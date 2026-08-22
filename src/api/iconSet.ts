import request, { type ApiResult } from "@/utils/request";

export interface IconSlotVO {
  key: string;
  label: string;
  group: string;
}

export interface IconSetItemVO {
  iconKey: string;
  iconUrl: string;
  sort?: number;
}

export interface IconSetVO {
  id: number;
  code: string;
  name: string;
  coverUrl?: string;
  status: number;
  active?: boolean;
  itemCount?: number;
  items?: IconSetItemVO[];
}

export interface IconSetSavePayload {
  code: string;
  name: string;
  coverUrl?: string;
  status?: number;
  items: { iconKey: string; iconUrl: string; sort?: number }[];
}

export function fetchIconSlots() {
  return request.get<ApiResult<IconSlotVO[]>>("/api/admin/icon-set/slots");
}

export function fetchIconSetList() {
  return request.get<ApiResult<IconSetVO[]>>("/api/admin/icon-set/list");
}

export function createIconSet(data: IconSetSavePayload) {
  return request.post<ApiResult<IconSetVO>>("/api/admin/icon-set", data);
}

export function updateIconSet(id: number, data: IconSetSavePayload) {
  return request.put<ApiResult<IconSetVO>>(`/api/admin/icon-set/${id}`, data);
}

export function activateIconSet(id: number) {
  return request.put<ApiResult<null>>(`/api/admin/icon-set/${id}/activate`);
}

export function clearActiveIconSet() {
  return request.put<ApiResult<null>>("/api/admin/icon-set/clear-active");
}

export function deleteIconSet(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/icon-set/${id}`);
}
