import request, { type ApiResult } from "@/utils/request";

export interface ProductVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  price: number;
  originPrice?: number;
  detailHtml?: string;
  status: number;
}

export interface ProductSavePayload {
  name: string;
  subtitle?: string;
  coverUrl?: string;
  price: number;
  originPrice?: number;
  detailHtml?: string;
  status?: number;
}

export function fetchProductList() {
  return request.get<ApiResult<ProductVO[]>>("/api/admin/product/list");
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
