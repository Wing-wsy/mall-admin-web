export type ThemeMode = "light" | "dark";

export const DEFAULT_PRIMARY = "#42b983";
export const THEME_PRESETS = [
  { label: "绿色", color: "#42b983" },
  { label: "蓝色", color: "#60a5fa" },
  { label: "橙黄", color: "#fbbf24" },
  { label: "玫红", color: "#fb7185" },
  { label: "紫色", color: "#a78bfa" },
] as const;

const STORAGE_PRIMARY = "mall_admin_theme_primary";
const STORAGE_MODE = "mall_admin_theme_mode";

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((x) => clamp(x).toString(16).padStart(2, "0")).join("")}`;
}

/** mix with white (t=0 primary, t=1 white) */
function mixWhite(hex: string, t: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r + (255 - rgb.r) * t, rgb.g + (255 - rgb.g) * t, rgb.b + (255 - rgb.b) * t);
}

function mixBlack(hex: string, t: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - t), rgb.g * (1 - t), rgb.b * (1 - t));
}

/** mix two colors (t=0 -> a, t=1 -> b) */
function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  if (!A || !B) return a;
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

export function normalizeHex(color: string): string {
  const v = (color || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toLowerCase()}`;
  return DEFAULT_PRIMARY;
}

/** 旧版偏深预设 → 浅色 */
const LEGACY_PRIMARY_MAP: Record<string, string> = {
  "#2563eb": "#60a5fa",
  "#0e7052": DEFAULT_PRIMARY,
  "#34d399": DEFAULT_PRIMARY,
  "#f59e0b": "#fbbf24",
  "#e11d48": "#fb7185",
  "#7c3aed": "#a78bfa",
};

export function readStoredPrimary(): string {
  try {
    const stored = localStorage.getItem(STORAGE_PRIMARY);
    if (!stored) return DEFAULT_PRIMARY;
    const hex = normalizeHex(stored);
    const migrated = LEGACY_PRIMARY_MAP[hex];
    if (migrated) {
      persistPrimary(migrated);
      return migrated;
    }
    return hex;
  } catch {
    return DEFAULT_PRIMARY;
  }
}

export function readStoredMode(): ThemeMode {
  try {
    const m = localStorage.getItem(STORAGE_MODE);
    return m === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function persistPrimary(color: string) {
  localStorage.setItem(STORAGE_PRIMARY, normalizeHex(color));
}

export function persistMode(mode: ThemeMode) {
  localStorage.setItem(STORAGE_MODE, mode);
}

const LIGHT_SURFACE: Record<string, string> = {
  "--mall-bg-page": "#f5f6f8",
  "--mall-bg-aside": "#ffffff",
  "--mall-bg-header": "#ffffff",
  "--mall-bg-card": "#ffffff",
  "--mall-text-primary": "#1f2329",
  "--mall-text-secondary": "#6b7280",
  "--mall-border": "#e5e7eb",
  "--el-bg-color": "#ffffff",
  "--el-bg-color-page": "#f5f6f8",
  "--el-bg-color-overlay": "#ffffff",
  "--el-text-color-primary": "#303133",
  "--el-text-color-regular": "#606266",
  "--el-text-color-secondary": "#909399",
  "--el-text-color-placeholder": "#a8abb2",
  "--el-border-color": "#dcdfe6",
  "--el-border-color-light": "#e4e7ed",
  "--el-border-color-lighter": "#ebeef5",
  "--el-border-color-extra-light": "#f2f6fc",
  "--el-fill-color-blank": "#ffffff",
  "--el-fill-color": "#f0f2f5",
  "--el-fill-color-light": "#f5f7fa",
  "--el-fill-color-lighter": "#fafafa",
  "--el-fill-color-extra-light": "#fafcff",
  "--el-fill-color-dark": "#ebedf0",
  "--el-fill-color-darker": "#e6e8eb",
  "--el-mask-color": "rgba(255, 255, 255, 0.9)",
  "--el-table-bg-color": "#ffffff",
  "--el-table-tr-bg-color": "#ffffff",
  "--el-table-header-bg-color": "#f5f7fa",
  "--el-table-row-hover-bg-color": "#f5f7fa",
  "--el-table-current-row-bg-color": "#ecf5ff",
  "--el-table-border-color": "#ebeef5",
};

/** 接近参考后台：更深底色 + 卡片分层，避免发灰发蓝 */
const DARK_SURFACE: Record<string, string> = {
  "--mall-bg-page": "#0a0c10",
  "--mall-bg-aside": "#0e1116",
  "--mall-bg-header": "#0e1116",
  "--mall-bg-card": "#151920",
  "--mall-text-primary": "#e8eaed",
  "--mall-text-secondary": "#8b93a1",
  "--mall-border": "#262b35",
  "--el-bg-color": "#151920",
  "--el-bg-color-page": "#0a0c10",
  "--el-bg-color-overlay": "#1a1f28",
  "--el-text-color-primary": "#e8eaed",
  "--el-text-color-regular": "#c9ced6",
  "--el-text-color-secondary": "#8b93a1",
  "--el-text-color-placeholder": "#6b7280",
  "--el-border-color": "#2c3340",
  "--el-border-color-light": "#262b35",
  "--el-border-color-lighter": "#1f2430",
  "--el-border-color-extra-light": "#1a1f28",
  "--el-fill-color-blank": "#151920",
  "--el-fill-color": "#1c212b",
  "--el-fill-color-light": "#1c212b",
  "--el-fill-color-lighter": "#222833",
  "--el-fill-color-extra-light": "#1a1f28",
  "--el-fill-color-dark": "#222833",
  "--el-fill-color-darker": "#2a303c",
  "--el-mask-color": "rgba(10, 12, 16, 0.8)",
  "--el-table-bg-color": "#151920",
  "--el-table-tr-bg-color": "#151920",
  "--el-table-header-bg-color": "#1a1f28",
  "--el-table-row-hover-bg-color": "#1c2430",
  "--el-table-current-row-bg-color": "#1e2633",
  "--el-table-border-color": "#262b35",
};

const SURFACE_KEYS = Array.from(
  new Set([...Object.keys(LIGHT_SURFACE), ...Object.keys(DARK_SURFACE)])
);

export function applyTheme(primaryColor: string, mode: ThemeMode) {
  const primary = normalizeHex(primaryColor);
  const root = document.documentElement;
  const isDark = mode === "dark";
  const cardBg = isDark ? DARK_SURFACE["--mall-bg-card"] : "#ffffff";

  const dark = isDark ? mixWhite(primary, 0.12) : mixBlack(primary, 0.15);
  // 暗色下 soft 用「主色混入深底」，避免浅白块
  const softBg = isDark ? mixHex(cardBg, primary, 0.18) : mixWhite(primary, 0.9);
  const softBorder = isDark ? mixHex(cardBg, primary, 0.38) : mixWhite(primary, 0.7);

  root.style.setProperty("--mall-color-primary", primary);
  root.style.setProperty("--mall-color-primary-dark", dark);
  root.style.setProperty("--mall-color-primary-soft-bg", softBg);
  root.style.setProperty("--mall-color-primary-soft-border", softBorder);

  root.style.setProperty("--el-color-primary", primary);
  root.style.setProperty("--el-color-primary-dark-2", isDark ? mixBlack(primary, 0.2) : dark);
  if (isDark) {
    root.style.setProperty("--el-color-primary-light-3", mixHex(cardBg, primary, 0.55));
    root.style.setProperty("--el-color-primary-light-5", mixHex(cardBg, primary, 0.35));
    root.style.setProperty("--el-color-primary-light-7", mixHex(cardBg, primary, 0.22));
    root.style.setProperty("--el-color-primary-light-8", mixHex(cardBg, primary, 0.16));
    root.style.setProperty("--el-color-primary-light-9", mixHex(cardBg, primary, 0.1));
  } else {
    root.style.setProperty("--el-color-primary-light-3", mixWhite(primary, 0.3));
    root.style.setProperty("--el-color-primary-light-5", mixWhite(primary, 0.5));
    root.style.setProperty("--el-color-primary-light-7", mixWhite(primary, 0.7));
    root.style.setProperty("--el-color-primary-light-8", mixWhite(primary, 0.8));
    root.style.setProperty("--el-color-primary-light-9", mixWhite(primary, 0.9));
  }

  // 先清掉上一模式残留的 surface 内联变量，再写入当前模式（避免斑马纹等仍用暗色）
  SURFACE_KEYS.forEach((k) => root.style.removeProperty(k));
  const surface = isDark ? DARK_SURFACE : LIGHT_SURFACE;
  Object.entries(surface).forEach(([k, v]) => root.style.setProperty(k, v));

  root.classList.toggle("dark", isDark);
  root.dataset.theme = mode;
}
