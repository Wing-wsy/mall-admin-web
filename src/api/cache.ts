import request, { type ApiResult } from "@/utils/request";

export interface CacheKeyVO {
  key: string;
  type: string;
  ttl: number;
  protectedKey?: boolean;
}

export interface CacheScanVO {
  total: number;
  records: CacheKeyVO[];
  truncated?: boolean;
}

export interface CacheDetailVO {
  key: string;
  type: string;
  ttl: number;
  protectedKey?: boolean;
  value?: string;
  truncated?: boolean;
  valueLength?: number;
  remark?: string;
}

export interface CacheSetPayload {
  key: string;
  value: string;
  ttlSeconds?: number | null;
}

export function fetchCacheKeys(params?: { pattern?: string; pageNum?: number; pageSize?: number }) {
  return request.get<ApiResult<CacheScanVO>>("/api/admin/system/cache/keys", { params });
}

export function fetchCacheDetail(key: string) {
  return request.get<ApiResult<CacheDetailVO>>("/api/admin/system/cache/detail", { params: { key } });
}

export function setCache(data: CacheSetPayload) {
  return request.post<ApiResult<void>>("/api/admin/system/cache", data);
}

export function updateCacheTtl(data: { key: string; ttlSeconds: number }) {
  return request.put<ApiResult<void>>("/api/admin/system/cache/ttl", data);
}

export function deleteCacheKeys(keys: string[]) {
  return request.delete<ApiResult<{ deleted: number }>>("/api/admin/system/cache", { data: { keys } });
}
