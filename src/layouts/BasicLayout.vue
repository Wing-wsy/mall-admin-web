<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">Mall Admin</div>
      <el-menu :default-active="active" router>
        <el-menu-item
          v-for="item in menus"
          :key="item.path"
          :index="item.path"
        >
          {{ item.meta?.title }}
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>{{ currentTitle }}</span>
        <div class="header-right">
          <span class="user">{{ userStore.username || "未登录" }}</span>
          <el-button link type="primary" @click="goLogin">登录壳</el-button>
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
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const menus = computed(() =>
  route.matched[0]?.children?.filter((item) => item.meta?.menu) || []
);

const active = computed(() => route.path);
const currentTitle = computed(() => String(route.meta.title || ""));

function goLogin() {
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
  letter-spacing: 0.04em;
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
