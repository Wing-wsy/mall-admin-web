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
          path: "banners",
          name: "banners",
          component: () => import("@/views/BannerView.vue"),
          meta: { title: "轮播管理", permission: "banner" },
        },
        {
          path: "categories",
          name: "categories",
          component: () => import("@/views/PlaceholderView.vue"),
          meta: { title: "分类管理", permission: "category" },
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
