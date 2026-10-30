<template>
  <div class="page" v-loading="loading">
    <div class="head">
      <div class="head-main">
        <h2 class="title">转化分析</h2>
        <div class="meta-row">
          <span class="range-badge">{{ overview?.rangeLabel || "今日" }}</span>
          <span v-if="overview?.startTime" class="period-chip">
            {{ formatPeriod(overview.startTime) }} — {{ formatPeriod(overview.endTime) }}
          </span>
        </div>
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

    <section class="block">
      <div class="block-head">
        <h3 class="block-title">结算漏斗</h3>
        <span class="block-desc">进入结算 → 提交订单 → 支付成功</span>
      </div>
      <div class="funnel-panel">
        <div class="funnel-row">
          <template v-for="(step, idx) in funnel" :key="step.event">
            <div class="funnel-card" :class="`tone-${idx}`">
              <div class="funnel-index">{{ idx + 1 }}</div>
              <div class="funnel-body">
                <div class="funnel-name">{{ step.name }}</div>
                <div class="funnel-uv">
                  {{ step.uv }}<span class="unit">用户</span>
                </div>
                <div v-if="idx > 0" class="funnel-rate">较上一步 {{ rateText(step.convertRate) }}</div>
                <div v-else class="funnel-rate muted">漏斗起点</div>
              </div>
            </div>
            <div v-if="idx < funnel.length - 1" class="funnel-connector" :class="`tone-${idx + 1}`">
              <div class="connector-line" />
              <div class="connector-rate">{{ rateText(funnel[idx + 1]?.convertRate) }}</div>
            </div>
          </template>
        </div>
        <div ref="funnelRef" class="chart funnel-chart" />
      </div>
    </section>

    <section class="block">
      <div class="block-head">
        <h3 class="block-title">浏览与意图</h3>
        <span class="block-desc">浏览量、购买意图与支付转化</span>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">商品详浏览</div>
          <div class="kpi-value">{{ browse.productViewUv }}<span class="unit">用户</span></div>
          <div class="kpi-meta muted">浏览 {{ browse.productViewCount }} 次</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">套餐详浏览</div>
          <div class="kpi-value">{{ browse.comboViewUv }}<span class="unit">用户</span></div>
          <div class="kpi-meta muted">浏览 {{ browse.comboViewCount }} 次</div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-label">有意图用户</div>
          <div class="kpi-value">{{ browse.intentUv }}<span class="unit">用户</span></div>
          <div class="kpi-meta muted">加购 / 立即买 / 进结算</div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-label">支付用户</div>
          <div class="kpi-value">{{ browse.payUv }}<span class="unit">用户</span></div>
          <div class="kpi-meta">意图→支付 {{ rateText(browse.intentPayRate) }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">搜索次数</div>
          <div class="kpi-value">{{ browse.searchCount }}<span class="unit">次</span></div>
          <div class="kpi-meta muted">无结果 {{ browse.searchEmptyCount }} 次</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">搜索无结果率</div>
          <div class="kpi-value">{{ rateText(browse.searchEmptyRate) }}</div>
          <div class="kpi-meta muted">无结果搜索占比</div>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="block-head">
        <h3 class="block-title">入口归因</h3>
        <span class="block-desc">加购从哪来、结算从哪进</span>
      </div>
      <div class="split">
        <div class="panel">
          <div class="panel-head">
            <span>加购来源</span>
            <span class="hint">按去重用户</span>
          </div>
          <div ref="sourceRef" class="chart sm" />
          <el-table :data="overview?.addCartBySource || []" size="small" class="dim-table" empty-text="暂无数据">
            <el-table-column prop="name" label="来源" min-width="100" />
            <el-table-column prop="uv" label="用户数" width="90" />
            <el-table-column prop="count" label="次数" width="80" />
          </el-table>
        </div>
        <div class="panel">
          <div class="panel-head">
            <span>结算入口</span>
            <span class="hint">按去重用户</span>
          </div>
          <div ref="entryRef" class="chart sm" />
          <el-table :data="overview?.checkoutByEntry || []" size="small" class="dim-table" empty-text="暂无数据">
            <el-table-column prop="name" label="入口" min-width="100" />
            <el-table-column prop="uv" label="用户数" width="90" />
            <el-table-column prop="count" label="次数" width="80" />
          </el-table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts/core";
import { BarChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  fetchTrackOverview,
  type TrackBrowseVO,
  type TrackOverviewVO,
  type TrackRange,
} from "@/api/track";
import { useThemeStore } from "@/stores/theme";

echarts.use([BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

/** 结算漏斗固定色：黄 / 蓝 / 绿，不随主题变化 */
const FUNNEL_COLORS = ["#fcd34d", "#93c5fd", "#86efac"] as const;

const themeStore = useThemeStore();
const loading = ref(false);
const range = ref<TrackRange>("today");
const overview = ref<TrackOverviewVO | null>(null);
const funnelRef = ref<HTMLDivElement | null>(null);
const sourceRef = ref<HTMLDivElement | null>(null);
const entryRef = ref<HTMLDivElement | null>(null);

let funnelChart: echarts.ECharts | null = null;
let sourceChart: echarts.ECharts | null = null;
let entryChart: echarts.ECharts | null = null;

const funnel = computed(() => overview.value?.funnel || []);
const browse = computed<TrackBrowseVO>(
  () =>
    overview.value?.browse || {
      productViewUv: 0,
      productViewCount: 0,
      comboViewUv: 0,
      comboViewCount: 0,
      intentUv: 0,
      payUv: 0,
      searchCount: 0,
      searchEmptyCount: 0,
    },
);

function rateText(v?: number | string | null) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function formatPeriod(raw: string) {
  return raw.slice(0, 16).replace("T", " ");
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchTrackOverview(range.value);
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
  if (funnelRef.value && !funnelChart) funnelChart = echarts.init(funnelRef.value);
  if (sourceRef.value && !sourceChart) sourceChart = echarts.init(sourceRef.value);
  if (entryRef.value && !entryChart) entryChart = echarts.init(entryRef.value);
}

function mixHex(hex: string, ratio: number, toward = "#ffffff") {
  const parse = (h: string) => {
    const s = h.replace("#", "").trim();
    const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ] as const;
  };
  try {
    const [r1, g1, b1] = parse(hex);
    const [r2, g2, b2] = parse(toward);
    const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio);
    const to = (n: number) => n.toString(16).padStart(2, "0");
    return `#${to(mix(r1, r2))}${to(mix(g1, g2))}${to(mix(b1, b2))}`;
  } catch {
    return hex;
  }
}

function chartTheme() {
  const style = getComputedStyle(document.documentElement);
  const primary =
    themeStore.primaryColor ||
    style.getPropertyValue("--mall-color-primary").trim() ||
    "#2563eb";
  const text = style.getPropertyValue("--mall-text-secondary").trim() || "#6b7280";
  const isDark = themeStore.mode === "dark";
  return {
    primary,
    soft: mixHex(primary, isDark ? 0.35 : 0.45),
    text,
    legend: isDark ? "#c9ced6" : "#4b5563",
    label: isDark ? "#c9ced6" : "#374151",
    split: isDark ? "#262b35" : "#f3f4f6",
  };
}

function renderCharts() {
  ensureCharts();
  const t = chartTheme();
  const funnelSteps = overview.value?.funnel || [];
  // 图表自下而上：支付成功 → 提交订单 → 进入结算，颜色与卡片顺序对齐
  const steps = [...funnelSteps].reverse();
  const stepColors = [...FUNNEL_COLORS].slice(0, funnelSteps.length).reverse();
  const maxUv = Math.max(1, ...steps.map((s) => s.uv));
  funnelChart?.setOption(
    {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const item = list[0] as { axisValue?: string; name?: string; value?: number };
          const name = item?.axisValue || item?.name || "";
          return `${name}<br/>${item?.value ?? 0} 用户`;
        },
      },
      grid: { left: 88, right: 48, top: 16, bottom: 20 },
      xAxis: {
        type: "value",
        max: maxUv,
        axisLabel: { color: t.text },
        splitLine: { lineStyle: { color: t.split, type: "dashed" } },
      },
      yAxis: {
        type: "category",
        data: steps.map((s) => s.name),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: t.label },
      },
      series: [
        {
          type: "bar",
          data: steps.map((s, i) => ({
            value: s.uv,
            itemStyle: {
              borderRadius: [0, 8, 8, 0],
              color: stepColors[i] || FUNNEL_COLORS[0],
            },
          })),
          barWidth: 22,
          label: {
            show: true,
            position: "right",
            color: t.label,
            formatter: "{c} 用户",
          },
        },
      ],
    },
    true,
  );

  const pieOption = (rows: { name: string; uv: number }[]) => ({
    tooltip: {
      trigger: "item",
      formatter: "{b}<br/>{c} 用户（{d}%）",
    },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: t.legend },
    },
    color: [
      t.primary,
      mixHex(t.primary, 0.25, "#34d399"),
      "#f59e0b",
      "#a78bfa",
      "#fb7185",
      "#38bdf8",
    ],
    series: [
      {
        type: "pie",
        radius: ["42%", "66%"],
        center: ["50%", "44%"],
        data: rows.length
          ? rows.map((r) => ({ name: r.name, value: r.uv }))
          : [{ name: "暂无数据", value: 0 }],
        label: { show: false },
        emphasis: {
          scale: true,
          itemStyle: { shadowBlur: 12, shadowColor: "rgba(15,23,42,0.12)" },
        },
      },
    ],
  });

  sourceChart?.setOption(pieOption(overview.value?.addCartBySource || []), true);
  entryChart?.setOption(pieOption(overview.value?.checkoutByEntry || []), true);
}

function onResize() {
  funnelChart?.resize();
  sourceChart?.resize();
  entryChart?.resize();
}

onMounted(() => {
  load();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  funnelChart?.dispose();
  sourceChart?.dispose();
  entryChart?.dispose();
});

watch(
  () => [themeStore.mode, themeStore.primaryColor] as const,
  async () => {
    await nextTick();
    renderCharts();
  },
);
</script>

<style scoped>
.page {
  min-height: 100%;
  padding-bottom: 8px;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.head-main {
  min-width: 0;
}
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--mall-text-primary);
}
.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.range-badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--mall-color-primary-soft-bg);
  border: 1px solid var(--mall-color-primary-soft-border);
  color: var(--mall-color-primary);
  font-size: 12px;
  font-weight: 600;
}
.period-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--mall-bg-card);
  border: 1px solid var(--mall-border);
  color: var(--mall-text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
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

.block {
  margin-bottom: 22px;
}
.block-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.block-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--mall-text-primary);
  padding-left: 10px;
  border-left: 3px solid var(--mall-color-primary);
  line-height: 1.2;
}
.block-desc {
  font-size: 12px;
  color: var(--mall-text-secondary);
}

.funnel-panel {
  background: var(--mall-bg-card);
  border: 1px solid var(--mall-border);
  border-radius: 16px;
  padding: 18px 18px 10px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.funnel-row {
  display: flex;
  align-items: stretch;
  gap: 0;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.funnel-card {
  flex: 1 1 160px;
  display: flex;
  gap: 12px;
  min-width: 160px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid transparent;
}
/* 固定浅色：进入结算黄 / 提交订单蓝 / 支付成功绿 */
.funnel-card.tone-0 {
  --funnel-tone: #fbbf24;
  background: #fffbeb;
  border-color: #fef3c7;
}
.funnel-card.tone-1 {
  --funnel-tone: #93c5fd;
  background: #f8fbff;
  border-color: #dbeafe;
}
.funnel-card.tone-2 {
  --funnel-tone: #86efac;
  background: #f7fdf9;
  border-color: #dcfce7;
}
.funnel-index {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--funnel-tone) 55%, #fff);
  border: 1px solid color-mix(in srgb, var(--funnel-tone) 70%, #fff);
  color: color-mix(in srgb, var(--funnel-tone) 45%, #334155);
  font-size: 13px;
  font-weight: 700;
}
.funnel-body {
  min-width: 0;
}
.funnel-name {
  font-size: 13px;
  color: var(--mall-text-secondary);
}
.funnel-uv {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: color-mix(in srgb, var(--funnel-tone) 55%, #334155);
  line-height: 1.1;
}
.unit {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 500;
  color: color-mix(in srgb, var(--funnel-tone) 40%, #64748b);
}
.funnel-rate {
  margin-top: 8px;
  font-size: 12px;
  color: color-mix(in srgb, var(--funnel-tone) 45%, #64748b);
  font-weight: 500;
}
.funnel-rate.muted {
  color: var(--mall-text-secondary);
  font-weight: 400;
}
.funnel-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 64px;
  flex-shrink: 0;
  gap: 6px;
  align-self: center;
  --funnel-tone: #94a3b8;
}
.funnel-connector.tone-1 {
  --funnel-tone: #93c5fd;
}
.funnel-connector.tone-2 {
  --funnel-tone: #86efac;
}
.connector-line {
  width: 36px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--funnel-tone));
  position: relative;
}
.connector-line::after {
  content: "";
  position: absolute;
  right: -1px;
  top: 50%;
  width: 6px;
  height: 6px;
  border-right: 2px solid var(--funnel-tone);
  border-top: 2px solid var(--funnel-tone);
  transform: translateY(-50%) rotate(45deg);
}
.connector-rate {
  font-size: 11px;
  color: var(--funnel-tone);
  font-variant-numeric: tabular-nums;
}
.funnel-chart {
  height: 180px;
  margin-top: 4px;
}

.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.panel {
  background: var(--mall-bg-card);
  border: 1px solid var(--mall-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
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
  height: 220px;
}
.chart.sm {
  height: 210px;
}
.dim-table {
  margin-top: 4px;
}
.dim-table :deep(.el-table__header th) {
  background: color-mix(in srgb, var(--mall-bg-page) 80%, transparent);
  color: var(--mall-text-secondary);
  font-weight: 500;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}
.kpi-card {
  background: var(--mall-bg-card);
  border-radius: 16px;
  padding: 18px 16px;
  border: 1px solid var(--mall-border);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.kpi-card.accent {
  background: var(--mall-color-primary-soft-bg);
  border-color: var(--mall-color-primary-soft-border);
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
  line-height: 1.15;
}
.kpi-value .unit {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--mall-text-secondary);
}
.kpi-card.accent .kpi-value {
  color: var(--mall-color-primary);
}
.kpi-card.accent .kpi-value .unit {
  color: var(--mall-color-primary);
  opacity: 0.75;
}
.kpi-meta {
  margin-top: 10px;
  font-size: 12px;
  color: var(--mall-color-primary);
}
.kpi-meta.muted {
  color: var(--mall-text-secondary);
}

@media (max-width: 1200px) {
  .kpi-grid,
  .split {
    grid-template-columns: 1fr 1fr;
  }
  .funnel-connector {
    display: none;
  }
}
@media (max-width: 720px) {
  .kpi-grid,
  .split {
    grid-template-columns: 1fr;
  }
}
</style>
