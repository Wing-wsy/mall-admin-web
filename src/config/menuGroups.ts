import type { MenuNode } from "@/stores/user";

/** 仅映射图标资源名；菜单文案一律用后端 menus.name */
const MENU_ICONS: Record<string, string> = {
  dashboard: "dashboard",
  track: "chart",
  goods: "shopping",
  product: "shopping",
  combo: "nested",
  category: "tree",
  festival: "date",
  "sale-attr": "list",
  spec: "size",
  brand: "star",
  marketing: "star",
  banner: "example",
  nav: "guide",
  hot: "chart",
  iconset: "icon",
  theme: "theme",
  coupon: "skill",
  point: "star",
  voucher: "documentation",
  trade: "money",
  order: "form",
  aftersale: "edit",
  commission: "money",
  balance: "chart",
  "order-review": "message",
  ums: "peoples",
  member: "user",
  level: "peoples",
  blacklist: "phone",
  supplier: "build",
  "system:tenant": "tree-table",
  system: "system",
  shop: "shopping",
  "system:user": "user",
  "system:role": "peoples",
  "system:permission": "list",
  "system:operlog": "log",
  "system:cache": "server",
  "ai:assistant": "guide",
};

export function menuIcon(code: string) {
  return MENU_ICONS[code] || "";
}

/** 保持后端 menus 树顺序与名称，不做文案覆盖 */
export function buildSidebarMenus(menus: MenuNode[]): MenuNode[] {
  return menus || [];
}
