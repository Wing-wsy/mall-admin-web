import { createRouter, createWebHistory } from "vue-router";
import BasicLayout from "@/layouts/BasicLayout.vue";

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
          meta: { title: "工作台", menu: true },
        },
        {
          path: "ping",
          name: "ping",
          component: () => import("@/views/PingView.vue"),
          meta: { title: "联调探测", menu: true },
        },
        {
          path: "products",
          name: "products",
          component: () => import("@/views/PlaceholderView.vue"),
          meta: { title: "商品管理", menu: true },
        },
        {
          path: "categories",
          name: "categories",
          component: () => import("@/views/PlaceholderView.vue"),
          meta: { title: "分类管理", menu: true },
        },
      ],
    },
  ],
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title || "Mall Admin")} - Mall Admin`;
});

export default router;
