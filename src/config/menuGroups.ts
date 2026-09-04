import type { MenuNode } from "@/stores/user";

export const MENU_GROUPS: { code: string; name: string; childCodes: string[] }[] = [
  { code: "goods", name: "商品", childCodes: ["product", "combo", "category", "festival", "spec"] },
  { code: "marketing", name: "营销", childCodes: ["banner", "nav", "hot", "iconset", "theme", "coupon", "point", "voucher"] },
  { code: "trade", name: "交易", childCodes: ["order", "aftersale", "commission", "balance", "order-review"] },
  { code: "ums", name: "用户", childCodes: ["member", "level", "blacklist", "supplier", "system:tenant"] },
  { code: "system", name: "系统", childCodes: ["shop", "system:user", "system:role", "system:operlog", "system:cache"] },
];

const MENU_TITLES: Record<string, string> = {
  dashboard: "工作台",
  goods: "商品",
  product: "商品管理",
  combo: "组合套装",
  category: "商品分类",
  festival: "节日分类",
  spec: "规格管理",
  marketing: "营销",
  banner: "轮播管理",
  nav: "首页导航",
  hot: "热卖推荐",
  iconset: "图标套装",
  theme: "节日皮肤",
  coupon: "优惠券",
  point: "积分兑换",
  voucher: "兑换券",
  trade: "交易",
  order: "订单管理",
  aftersale: "售后管理",
  commission: "佣金管理",
  balance: "资金流水",
  "order-review": "订单评价",
  ums: "用户",
  member: "用户管理",
  level: "会员等级",
  blacklist: "手机黑名单",
  supplier: "供应商",
  "system:tenant": "租户管理",
  system: "系统",
  shop: "店铺设置",
  "system:user": "账号管理",
  "system:role": "角色管理",
  "system:operlog": "操作日志",
  "system:cache": "缓存管理",
};

function titled(node: MenuNode): MenuNode {
  return {
    ...node,
    name: MENU_TITLES[node.code] || node.name,
    children: node.children?.map(titled),
  };
}

export function buildSidebarMenus(menus: MenuNode[]): MenuNode[] {
  const leaves: MenuNode[] = [];
  const walk = (nodes: MenuNode[]) => {
    for (const n of nodes || []) {
      if (n.path) leaves.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(menus);

  const byCode = new Map(leaves.map((n) => [n.code, n]));
  const used = new Set<string>();
  const out: MenuNode[] = [];

  const dashboard = byCode.get("dashboard");
  if (dashboard) {
    out.push(titled({ ...dashboard, children: [] }));
    used.add("dashboard");
  }

  for (const group of MENU_GROUPS) {
    const children = group.childCodes
      .map((code) => byCode.get(code))
      .filter((n): n is MenuNode => !!n)
      .map((n) => titled({ ...n, children: [] }));
    if (!children.length) continue;
    children.forEach((n) => used.add(n.code));
    out.push({
      id: 0,
      name: group.name,
      code: group.code,
      type: 1,
      children,
    });
  }

  for (const leaf of leaves) {
    if (!used.has(leaf.code)) {
      out.push(titled({ ...leaf, children: [] }));
    }
  }
  return out;
}
