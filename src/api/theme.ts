import request, { type ApiResult } from "@/utils/request";

export interface ThemeVO {
  id: number;
  code: string;
  name: string;
  festivalCategoryId: number;
  festivalPath?: string;
  priority: number;
  status: number;
  startTime?: string;
  endTime?: string;
  activeWindow?: boolean;
  tokens?: Record<string, unknown>;
  copy?: Record<string, unknown>;
  assets?: Record<string, unknown>;
  tabbar?: Record<string, unknown>;
}

export interface ThemeSavePayload {
  code: string;
  name: string;
  festivalCategoryId: number;
  priority?: number;
  status?: number;
  tokens?: Record<string, unknown>;
  copy?: Record<string, unknown>;
  assets?: Record<string, unknown>;
  tabbar?: Record<string, unknown>;
}

export function fetchThemeList() {
  return request.get<ApiResult<ThemeVO[]>>("/api/admin/theme/list");
}

export function createTheme(data: ThemeSavePayload) {
  return request.post<ApiResult<ThemeVO>>("/api/admin/theme", data);
}

export function updateTheme(id: number, data: ThemeSavePayload) {
  return request.put<ApiResult<ThemeVO>>(`/api/admin/theme/${id}`, data);
}

export function updateThemeStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/theme/${id}/status`, { status });
}

export function deleteTheme(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/theme/${id}`);
}
