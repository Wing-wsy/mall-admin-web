import request, { type ApiResult } from "@/utils/request";

export interface ProductSkuVO {
  id?: number;
  specId: number;
  specName?: string;
  price: number;
  originPrice?: number;
  status: number;
  sort?: number;
}

export interface ProductVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  price: number;
  originPrice?: number;
  detailHtml?: string;
  detailImageUrls?: string[];
  status: number;
  categoryId: number;
  categoryPath?: string;
  festivalIds?: number[];
  festivalPaths?: string[];
  specSummary?: string;
  skus?: ProductSkuVO[];
}

export interface ProductSkuPayload {
  specId: number;
  price: number;
  originPrice?: number;
  status?: number;
  sort?: number;
}

export interface ProductSavePayload {
  name: string;
  subtitle?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  detailHtml?: string;
  detailImageUrls?: string[];
  status?: number;
  categoryId: number;
  festivalIds?: number[];
  skus: ProductSkuPayload[];
}

export interface ProductQuery {
  name?: string;
  categoryId?: number;
  festivalId?: number;
  status?: number;
}

export function fetchProductList(params?: ProductQuery) {
  return request.get<ApiResult<ProductVO[]>>("/api/admin/product/list", { params });
}

export function createProduct(data: ProductSavePayload) {
  return request.post<ApiResult<ProductVO>>("/api/admin/product", data);
}

export function updateProduct(id: number, data: ProductSavePayload) {
  return request.put<ApiResult<ProductVO>>(`/api/admin/product/${id}`, data);
}

export function updateProductStatus(id: number, status: number) {
  return request.put<ApiResult<null>>(`/api/admin/product/${id}/status`, { status });
}

export function uploadAdminFile(file: File, folder = "product") {
  const form = new FormData();
  form.append("file", file);
  return request.post<ApiResult<{ objectKey: string; url: string }>>(
    `/api/admin/file/upload?folder=${folder}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
}
