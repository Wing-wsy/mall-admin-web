import request, { type ApiResult } from "@/utils/request";

export type TrackRange = "today" | "yesterday" | "before" | "7d" | "30d" | "365d";

export interface TrackFunnelStepVO {
  event: string;
  name: string;
  uv: number;
  convertRate?: number | string | null;
}

export interface TrackDimCountVO {
  key: string;
  name: string;
  uv: number;
  count: number;
}

export interface TrackBrowseVO {
  productViewUv: number;
  productViewCount: number;
  comboViewUv: number;
  comboViewCount: number;
  intentUv: number;
  payUv: number;
  intentPayRate?: number | string | null;
  searchCount: number;
  searchEmptyCount: number;
  searchEmptyRate?: number | string | null;
}

export interface TrackOverviewVO {
  range: TrackRange;
  rangeLabel: string;
  startTime: string;
  endTime: string;
  funnel: TrackFunnelStepVO[];
  addCartBySource: TrackDimCountVO[];
  checkoutByEntry: TrackDimCountVO[];
  browse: TrackBrowseVO;
}

export function fetchTrackOverview(range: TrackRange = "today") {
  return request.get<ApiResult<TrackOverviewVO>>("/api/admin/track/overview", {
    params: { range },
  });
}
