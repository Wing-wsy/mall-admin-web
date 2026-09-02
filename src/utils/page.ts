import type { PageResult } from "@/utils/request";

/** Normalize list/page API payloads into { total, records }. */
export function asPage<T>(payload: unknown): PageResult<T> {
  if (Array.isArray(payload)) {
    return { total: payload.length, records: payload as T[] };
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const records = obj.records ?? obj.list;
    if (Array.isArray(records)) {
      const total = Number(obj.total);
      return {
        total: Number.isFinite(total) ? total : records.length,
        records: records as T[],
      };
    }
  }
  return { total: 0, records: [] };
}
