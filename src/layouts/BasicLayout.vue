<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">Mall Admin</div>
      <div class="aside-menu">
        <el-menu :default-active="active" router>
          <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
            {{ item.title }}
          </el-menu-item>
        </el-menu>
      </div>
    </el-aside>
    <el-container class="main-wrap">
      <el-header class="header">
        <div class="tabs" role="tablist">
          <button
            v-for="tab in tabStore.tabs"
            :key="tab.path"
            class="tab"
            :class="{ active: tab.path === active }"
            type="button"
            @click="openTab(tab.path)"
          >
            <span class="tab-title">{{ tab.title }}</span>
            <span
              v-if="tabStore.tabs.length > 1"
              class="tab-close"
              @click.stop="closeTab(tab.path)"
            >×</span>
          </button>
        </div>
        <div class="header-right">
          <span class="user">{{ userStore.tenantName }} · {{ userStore.nickname || userStore.username }}</span>
          <el-button link type="primary" @click="onLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="active" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { logoutAdmin } from "@/api/auth";
import { useTabStore } from "@/stores/tabs";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const tabStore = useTabStore();

const menus = computed(() => userStore.flatMenus);
const active = computed(() => route.path);

watch(
  () => route.path,
  () => {
    if (route.path === "/login") return;
    tabStore.add({
      path: route.path,
      title: String(route.meta.title || menus.value.find((m) => m.path === route.path)?.title || "未命名"),
    });
  },
  { immediate: true }
);

function openTab(path: string) {
  if (path !== route.path) router.push(path);
}

function closeTab(path: string) {
  const next = tabStore.close(path);
  if (path === route.path && next) router.push(next.path);
}

async function onLogout() {
  try {
    await logoutAdmin();
  } catch {
    // ignore
  }
  tabStore.clear();
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
}
.aside {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #111827;
  color: #fff;
}
.brand {
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 700;
}
.aside-menu {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.aside-menu::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
.aside :deep(.el-menu) {
  border-right: none;
  background: transparent;
}
.main-wrap {
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar {
  display: none;
}
.tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
}
.tab.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}
.tab-title {
  max-width: 120px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tab-close {
  width: 14px;
  line-height: 1;
  color: #9ca3af;
}
.tab-close:hover {
  color: #111827;
}
.main {
  overflow-y: auto;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user {
  color: #6b7280;
  font-size: 14px;
}
</style>
