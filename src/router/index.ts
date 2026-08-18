import { createRouter, createWebHistory } from "vue-router";
import BasicLayout from "@/layouts/BasicLayout.vue";
import { useUserStore } from "@/stores/user";

const SKELETON_PREFIX = "skeleton-token";

function readToken() {
  const token = localStorage.getItem("mall_admin_token") || "";
  if (token.startsWith(SKELETON_PREFIX)) {
    localStorage.clear();
    return "";
  }
  return token;
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { title: "登录" },
    },
    {
      path: "/",
      component: BasicLayout,
      redirect: "/dashboard",
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
          meta: { title: "工作台", permission: "dashboard" },
        },
        {
          path: "products",
          name: "products",
          component: () => import("@/views/ProductView.vue"),
          meta: { title: "商品管理", permission: "product" },
        },
        {
          path: "orders",
          name: "orders",
          component: () => import("@/views/OrderView.vue"),
          meta: { title: "订单管理", permission: "order" },
        },
        {
          path: "members",
          name: "members",
          component: () => import("@/views/MemberView.vue"),
          meta: { title: "用户管理", permission: "member" },
        },
        {
          path: "coupons",
          name: "coupons",
          component: () => import("@/views/CouponView.vue"),
          meta: { title: "优惠券", permission: "coupon" },
        },
        {
          path: "point-products",
          name: "point-products",
          component: () => import("@/views/PointProductView.vue"),
          meta: { title: "积分兑换", permission: "point" },
        },
        {
          path: "specs",
          name: "specs",
          component: () => import("@/views/SpecView.vue"),
          meta: { title: "规格管理", permission: "spec" },
        },
        {
          path: "banners",
          name: "banners",
          component: () => import("@/views/BannerView.vue"),
          meta: { title: "轮播管理", permission: "banner" },
        },
        {
          path: "nav-entries",
          name: "nav-entries",
          component: () => import("@/views/NavEntryView.vue"),
          meta: { title: "首页导航", permission: "nav" },
        },
        {
          path: "hot-products",
          name: "hot-products",
          component: () => import("@/views/HotProductView.vue"),
          meta: { title: "热卖推荐", permission: "hot" },
        },
        {
          path: "categories",
          name: "categories",
          component: () => import("@/views/CategoryView.vue"),
          meta: { title: "商品分类", permission: "category" },
        },
        {
          path: "festivals",
          name: "festivals",
          component: () => import("@/views/FestivalView.vue"),
          meta: { title: "节日分类", permission: "festival" },
        },
        {
          path: "themes",
          name: "themes",
          component: () => import("@/views/ThemeView.vue"),
          meta: { title: "节日皮肤", permission: "theme" },
        },
        {
          path: "shop",
          name: "shop",
          component: () => import("@/views/ShopView.vue"),
          meta: { title: "客服配置", permission: "shop" },
        },
        {
          path: "system/tenants",
          name: "system-tenants",
          component: () => import("@/views/system/TenantView.vue"),
          meta: { title: "租户管理", permission: "system:tenant" },
        },
        {
          path: "system/users",
          name: "system-users",
          component: () => import("@/views/system/UserView.vue"),
          meta: { title: "账号管理", permission: "system:user" },
        },
        {
          path: "system/roles",
          name: "system-roles",
          component: () => import("@/views/system/RoleView.vue"),
          meta: { title: "角色管理", permission: "system:role" },
        },
        {
          path: "ping",
          name: "ping",
          component: () => import("@/views/PingView.vue"),
          meta: { title: "联调探测" },
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const token = readToken();
  if (to.path !== "/login" && !token) {
    return "/login";
  }
  if (to.path === "/login") {
    return true;
  }
  const perm = to.meta.permission as string | undefined;
  if (perm) {
    const store = useUserStore();
    if (!store.hasPermission(perm)) {
      return store.flatMenus[0]?.path || "/login";
    }
  }
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title || "Mall Admin")} - Mall Admin`;
});

export default router;
