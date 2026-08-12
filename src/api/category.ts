import request, { type ApiResult } from "@/utils/request";

export const CATEGORY_TYPE_PRODUCT = 1;
export const CATEGORY_TYPE_FESTIVAL = 2;

export interface CategoryTreeVO {
  id: number;
  type: number;
  parentId: number;
  name: string;
  iconUrl?: string;
  sort: number;
  status: number;
  startTime?: string;
  endTime?: string;
  activeWindow?: boolean;
  children?: CategoryTreeVO[];
}

export interface CategoryLeafVO {
  id: number;
  parentId: number;
  parentName: string;
  name: string;
  status: number;
  pathName: string;
}

export interface CategorySavePayload {
  type?: number;
  parentId?: number;
  name: string;
  iconUrl?: string;
  sort?: number;
  status?: number;
  startTime?: string;
  endTime?: string;
}

export function fetchCategoryTree(type: number) {
  return request.get<ApiResult<CategoryTreeVO[]>>("/api/admin/category/tree", { params: { type } });
}

export function fetchCategoryLeaves(type: number) {
  return request.get<ApiResult<CategoryLeafVO[]>>("/api/admin/category/leaves", { params: { type } });
}

export function createCategory(data: CategorySavePayload) {
  return request.post<ApiResult<CategoryTreeVO>>("/api/admin/category", data);
}

export function updateCategory(id: number, data: CategorySavePayload) {
  return request.put<ApiResult<CategoryTreeVO>>(`/api/admin/category/${id}`, data);
}

export function updateCategoryStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/category/${id}/status`, { status });
}

export function deleteCategory(id: number) {
  return request.delete<ApiResult<null>>(`/api/admin/category/${id}`);
}
