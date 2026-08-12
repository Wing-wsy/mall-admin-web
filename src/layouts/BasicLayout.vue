<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">Mall Admin</div>
      <el-menu :default-active="active" router>
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          {{ item.title }}
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>{{ currentTitle }}</span>
        <div class="header-right">
          <span class="user">{{ userStore.tenantName }} · {{ userStore.nickname || userStore.username }}</span>
          <el-button link type="primary" @click="onLogout">退出</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { logoutAdmin } from "@/api/auth";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const menus = computed(() => userStore.flatMenus);
const active = computed(() => route.path);
const currentTitle = computed(() => String(route.meta.title || ""));

async function onLogout() {
  try {
    await logoutAdmin();
  } catch {
    // ignore
  }
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}
.aside {
  background: #111827;
  color: #fff;
}
.brand {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 700;
}
.aside :deep(.el-menu) {
  border-right: none;
  background: transparent;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
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
