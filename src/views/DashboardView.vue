<template>
  <div class="dash" v-loading="loading">
    <div class="dash-head">
      <div>
        <h2 class="title">工作台</h2>
        <p class="sub">
          {{ overview?.rangeLabel || "今日" }}经营概览
          <span v-if="overview?.startTime" class="period">
            {{ overview.startTime.slice(0, 16) }} ~ {{ overview.endTime.slice(0, 16) }}
          </span>
        </p>
      </div>
      <el-radio-group class="range-pills" v-model="range" size="default" @change="load">
        <el-radio-button value="today">今日</el-radio-button>
        <el-radio-button value="yesterday">昨日</el-radio-button>
        <el-radio-button value="before">前日</el-radio-button>
        <el-radio-button value="7d">近一周</el-radio-button>
        <el-radio-button value="30d">近一月</el-radio-button>
        <el-radio-button value="365d">近一年</el-radio-button>
      </el-radio-group>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card accent">
        <div class="kpi-label">成交额</div>
        <div class="kpi-value">¥{{ money(overview?.kpi?.gmv) }}</div>
        <div class="kpi-meta" :class="rateClass(overview?.gmvChangeRate)">
          环比 {{ rateText(overview?.gmvChangeRate) }}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">成交单</div>
        <div class="kpi-value">{{ overview?.kpi?.paidOrderCount ?? 0 }}</div>
        <div class="kpi-meta" :class="rateClass(overview?.paidOrderChangeRate)">
          环比 {{ rateText(overview?.paidOrderChangeRate) }}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">下单量</div>
        <div class="kpi-value">{{ overview?.kpi?.orderCount ?? 0 }}</div>
        <div class="kpi-meta" :class="rateClass(overview?.orderChangeRate)">
          环比 {{ rateText(overview?.orderChangeRate) }}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">售后单</div>
        <div class="kpi-value">{{ overview?.kpi?.afterSaleCount ?? 0 }}</div>
        <div class="kpi-meta muted">退款 ¥{{ money(overview?.kpi?.refundAmount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">积分兑换</div>
        <div class="kpi-value">{{ overview?.kpi?.pointsOrderCount ?? 0 }}</div>
        <div class="kpi-meta muted">消耗 {{ overview?.kpi?.pointsAmount ?? 0 }} 分</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">兑换券订单</div>
        <div class="kpi-value">{{ overview?.kpi?.voucherOrderCount ?? 0 }}</div>
        <div class="kpi-meta muted">礼品兑换核销</div>
      </div>
    </div>

    <div class="todo-row">
      <button class="todo" type="button" @click="go('/orders')">
        <span class="todo-num">{{ overview?.todos?.waitShip ?? 0 }}</span>
        <span class="todo-label">待发货</span>
      </button>
      <button class="todo" type="button" @click="go('/products')">
        <span class="todo-num">{{ overview?.todos?.pendingProductAudit ?? 0 }}</span>
        <span class="todo-label">待审商品</span>
      </button>
      <button class="todo" type="button" @click="go('/suppliers')">
        <span class="todo-num">{{ overview?.todos?.pendingSupplier ?? 0 }}</span>
        <span class="todo-label">待审供应商</span>
      </button>
      <button class="todo" type="button" @click="go('/after-sales')">
        <span class="todo-num warn">{{ overview?.todos?.openAfterSale ?? 0 }}</span>
        <span class="todo-label">进行中售后</span>
      </button>
    </div>

    <div class="chart-grid">
      <div class="panel wide">
        <div class="panel-head">
          <span>成交趋势</span>
          <span class="hint">现金已付 · 按支付时间</span>
        </div>
        <div ref="trendRef" class="chart" />
      </div>
      <div class="panel">
        <div class="panel-head">
          <span>订单类型</span>
          <span class="hint">按下单统计</span>
        </div>
        <div ref="typeRef" class="chart sm" />
      </div>
      <div class="panel">
        <div class="panel-head">
          <span>订单状态</span>
          <span class="hint">按下单统计</span>
        </div>
        <div ref="statusRef" class="chart sm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  fetchDashboardOverview,
  type DashboardOverviewVO,
  type DashboardRange,
} from "@/api/dashboard";
import { useThemeStore } from "@/stores/theme";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const router = useRouter();
const themeStore = useThemeStore();
const loading = ref(false);
const range = ref<DashboardRange>("today");
const overview = ref<DashboardOverviewVO | null>(null);
const trendRef = ref<HTMLDivElement | null>(null);
const typeRef = ref<HTMLDivElement | null>(null);
const statusRef = ref<HTMLDivElement | null>(null);

let trendChart: echarts.ECharts | null = null;
let typeChart: echarts.ECharts | null = null;
let statusChart: echarts.ECharts | null = null;

function money(v?: number | string | null) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function rateText(v?: number | string | null) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  const pct = (n * 100).toFixed(1);
  return `${n > 0 ? "+" : ""}${pct}%`;
}

function rateClass(v?: number | string | null) {
  if (v == null || v === "") return "muted";
  const n = Number(v);
  if (Number.isNaN(n) || n === 0) return "muted";
  return n > 0 ? "up" : "down";
}

function go(path: string) {
  router.push(path);
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchDashboardOverview(range.value);
    overview.value = data.data || null;
    await nextTick();
    renderCharts();
  } catch {
    overview.value = null;
  } finally {
    loading.value = false;
  }
}

function ensureCharts() {
  if (trendRef.value && !trendChart) {
    trendChart = echarts.init(trendRef.value);
  }
  if (typeRef.value && !typeChart) {
    typeChart = echarts.init(typeRef.value);
  }
  if (statusRef.value && !statusChart) {
    statusChart = echarts.init(statusRef.value);
  }
}

function chartTheme() {
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue("--mall-color-primary").trim() || "#2563eb";
  const text = style.getPropertyValue("--mall-text-secondary").trim() || "#6b7280";
  const muted = style.getPropertyValue("--mall-text-secondary").trim() || "#9ca3af";
  const border = style.getPropertyValue("--mall-border").trim() || "#e5e7eb";
  const isDark = themeStore.mode === "dark";
  return {
    primary,
    text,
    muted,
    border,
    split: isDark ? "#262b35" : "#f3f4f6",
    legend: isDark ? "#c9ced6" : "#4b5563",
    label: isDark ? "#c9ced6" : "#374151",
  };
}

function renderCharts() {
  ensureCharts();
  const series = overview.value?.series || [];
  const labels = series.map((p) => p.label);
  const gmv = series.map((p) => Number(p.gmv || 0));
  const counts = series.map((p) => p.orderCount || 0);
  const t = chartTheme();

  trendChart?.setOption(
    {
      color: [t.primary, "#fb923c"],
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      legend: { data: ["成交额", "成交单"], top: 0, textStyle: { color: t.legend } },
      grid: { left: 48, right: 48, top: 40, bottom: 28 },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: t.border } },
        axisLabel: { color: t.text },
      },
      yAxis: [
        {
          type: "value",
          name: "元",
          nameTextStyle: { color: t.muted },
          splitLine: { lineStyle: { color: t.split } },
          axisLabel: { color: t.muted },
        },
        {
          type: "value",
          name: "单",
          nameTextStyle: { color: t.muted },
          splitLine: { show: false },
          axisLabel: { color: t.muted },
        },
      ],
      series: [
        {
          name: "成交额",
          type: "line",
          smooth: true,
          showSymbol: labels.length <= 31,
          areaStyle: { color: `${t.primary}14` },
          data: gmv,
        },
        {
          name: "成交单",
          type: "bar",
          yAxisIndex: 1,
          barMaxWidth: 28,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: counts,
        },
      ],
    },
    true
  );

  const types = overview.value?.orderType || [];
  typeChart?.setOption(
    {
      color: [t.primary, "#f59e0b", "#10b981"],
      backgroundColor: "transparent",
      tooltip: { trigger: "item" },
      legend: { bottom: 0, textStyle: { color: t.legend } },
      series: [
        {
          type: "pie",
          radius: ["42%", "68%"],
          center: ["50%", "46%"],
          label: { formatter: "{b}\n{c}", color: t.label },
          data: types.map((item) => ({ name: item.name, value: item.value })),
        },
      ],
    },
    true
  );

  const statuses = overview.value?.orderStatus || [];
  statusChart?.setOption(
    {
      color: [t.primary],
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      grid: { left: 64, right: 24, top: 16, bottom: 28 },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: t.split } },
        axisLabel: { color: t.muted },
      },
      yAxis: {
        type: "category",
        data: statuses.map((s) => s.name),
        axisLabel: { color: t.text },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 6, 6, 0], color: t.primary },
          data: statuses.map((s) => s.value),
        },
      ],
    },
    true
  );
}

function onResize() {
  trendChart?.resize();
  typeChart?.resize();
  statusChart?.resize();
}

watch(
  () => [themeStore.mode, themeStore.primaryColor] as const,
  async () => {
    await nextTick();
    renderCharts();
  }
);

onMounted(() => {
  load();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  trendChart?.dispose();
  typeChart?.dispose();
  statusChart?.dispose();
});
</script>

<style scoped>
.dash {
  min-height: 100%;
}
.dash-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.range-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.range-pills :deep(.el-radio-button) {
  margin: 0;
}
.range-pills :deep(.el-radio-button__inner) {
  margin: 0;
  border-radius: 999px !important;
  border: 1px solid var(--mall-border) !important;
  box-shadow: none !important;
  background: var(--mall-bg-card);
  color: var(--mall-text-secondary);
  padding: 8px 14px;
  height: auto;
  line-height: 1.2;
}
.range-pills :deep(.el-radio-button:first-child .el-radio-button__inner),
.range-pills :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 999px !important;
}
.range-pills :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--mall-color-primary);
  border-color: var(--mall-color-primary) !important;
  color: #fff;
  box-shadow: none !important;
}
.range-pills :deep(.el-radio-button__inner:hover) {
  color: var(--mall-color-primary);
}
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--mall-text-primary);
}
.sub {
  margin: 6px 0 0;
  color: var(--mall-text-secondary);
  font-size: 13px;
}
.period {
  margin-left: 8px;
  color: var(--mall-text-secondary);
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
.kpi-card {
  background: var(--mall-bg-card);
  border-radius: 14px;
  padding: 18px 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  border: 1px solid var(--mall-border);
}
.kpi-card.accent {
  background: var(--mall-color-primary-soft-bg);
  border-color: var(--mall-color-primary-soft-border);
  color: var(--mall-color-primary);
}
.kpi-card.accent .kpi-label,
.kpi-card.accent .kpi-meta {
  color: var(--mall-color-primary);
}
.kpi-label {
  font-size: 13px;
  color: var(--mall-text-secondary);
}
.kpi-value {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--mall-text-primary);
}
.kpi-card.accent .kpi-value {
  color: var(--mall-color-primary);
}
.kpi-meta {
  margin-top: 8px;
  font-size: 12px;
}
.kpi-meta.up {
  color: #059669;
}
.kpi-meta.down {
  color: #dc2626;
}
.kpi-meta.muted {
  color: var(--mall-text-secondary);
}
.kpi-card.accent .kpi-meta.up {
  color: #059669;
}
.kpi-card.accent .kpi-meta.down {
  color: #dc2626;
}
.todo-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.todo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid var(--mall-border);
  border-radius: 14px;
  background: var(--mall-bg-card);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.todo:hover {
  border-color: var(--mall-color-primary-soft-border);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--mall-color-primary) 12%, transparent);
}
.todo-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--mall-color-primary);
}
.todo-num.warn {
  color: #ea580c;
}
.todo-label {
  font-size: 13px;
  color: var(--mall-text-secondary);
}
.chart-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 14px;
}
.panel {
  background: var(--mall-bg-card);
  border-radius: 14px;
  border: 1px solid var(--mall-border);
  padding: 16px;
  min-height: 320px;
}
.panel.wide {
  grid-column: 1 / -1;
  min-height: 360px;
}
.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--mall-text-primary);
}
.hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--mall-text-secondary);
}
.chart {
  width: 100%;
  height: 280px;
}
.chart.sm {
  height: 260px;
}
@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .chart-grid {
    grid-template-columns: 1fr 1fr;
  }
  .panel.wide {
    grid-column: 1 / -1;
  }
}
@media (max-width: 860px) {
  .kpi-grid,
  .todo-row,
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
