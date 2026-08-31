import request, { type ApiResult } from "@/utils/request";

export type DashboardRange = "today" | "yesterday" | "before" | "7d" | "30d" | "365d";

export interface DashboardKpiVO {
  gmv: number | string;
  paidOrderCount: number;
  orderCount: number;
  pointsOrderCount: number;
  pointsAmount: number;
  voucherOrderCount: number;
  afterSaleCount: number;
  refundAmount: number | string;
}

export interface DashboardNamedCountVO {
  name: string;
  value: number;
}

export interface DashboardSeriesPointVO {
  label: string;
  gmv: number | string;
  orderCount: number;
}

export interface DashboardTodoVO {
  waitShip: number;
  pendingProductAudit: number;
  pendingSupplier: number;
  openAfterSale: number;
}

export interface DashboardOverviewVO {
  range: DashboardRange;
  rangeLabel: string;
  startTime: string;
  endTime: string;
  compareStartTime?: string;
  compareEndTime?: string;
  kpi: DashboardKpiVO;
  compareKpi: DashboardKpiVO;
  gmvChangeRate?: number | string | null;
  paidOrderChangeRate?: number | string | null;
  orderChangeRate?: number | string | null;
  orderStatus: DashboardNamedCountVO[];
  orderType: DashboardNamedCountVO[];
  series: DashboardSeriesPointVO[];
  todos: DashboardTodoVO;
}

export function fetchDashboardOverview(range: DashboardRange = "today") {
  return request.get<ApiResult<DashboardOverviewVO>>("/api/admin/dashboard/overview", {
    params: { range },
  });
}
