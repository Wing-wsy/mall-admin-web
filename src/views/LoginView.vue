<template>
  <div class="login-page" :class="{ dark: themeStore.mode === 'dark' }">
    <el-card class="login-card" shadow="never">
      <button
        type="button"
        class="theme-toggle"
        :title="themeStore.mode === 'dark' ? '切换白天模式' : '切换黑夜模式'"
        @click="toggleTheme"
      >
        <el-icon :size="16">
          <Sunny v-if="themeStore.mode === 'dark'" />
          <Moon v-else />
        </el-icon>
      </button>
      <h2>礼尚企服</h2>
      <el-form class="login-form" label-position="top" @submit.prevent>
        <el-form-item label="账号">
          <el-input v-model="username" class="pill-input" placeholder="请输入账号" @keyup.enter="onLogin" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="password"
            class="pill-input"
            type="password"
            show-password
            placeholder="请输入登录密码"
            @keyup.enter="onLogin"
          />
        </el-form-item>
        <div class="login-actions">
          <el-button class="login-btn" type="primary" :loading="loading" @click="onLogin">登录</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Moon, Sunny } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { loginAdmin } from "@/api/auth";
import { useLockStore } from "@/stores/lock";
import { useThemeStore } from "@/stores/theme";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();
const lockStore = useLockStore();
const themeStore = useThemeStore();
const username = ref("merchant");
const password = ref("admin123");
const loading = ref(false);

onMounted(() => {
  lockStore.unlock();
  userStore.logout();
});

function toggleTheme() {
  themeStore.setMode(themeStore.mode === "dark" ? "light" : "dark");
}

async function onLogin() {
  loading.value = true;
  try {
    const { data } = await loginAdmin(username.value.trim(), password.value);
    if (!data?.data?.token) {
      ElMessage.error("登录响应异常");
      return;
    }
    userStore.login(data.data);
    lockStore.unlock();
    ElMessage.success("登录成功");
    const first = userStore.flatMenus[0]?.path || "/dashboard";
    await router.replace(first);
  } catch {
    // handled
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f3f4f6 url("../assets/login-bg.jpg") center / cover no-repeat;
}
.login-page.dark {
  background: #0a0a0a;
}
.login-card {
  position: relative;
  width: 400px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
  background: var(--mall-bg-card, #fff);
}
.login-page.dark .login-card {
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  border: 1px solid var(--mall-border, #262b35);
}
.login-card :deep(.el-card__body) {
  padding: 28px 28px 22px;
}
.theme-toggle {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--mall-border, #e5e7eb);
  border-radius: 8px;
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--mall-text-secondary, #6b7280);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}
.theme-toggle:hover {
  color: var(--mall-color-primary);
  border-color: var(--mall-color-primary-soft-border);
  background: var(--mall-color-primary-soft-bg);
}
h2 {
  margin: 0 0 24px;
  text-align: center;
  font-size: 22px;
  font-weight: 500;
  color: var(--mall-text-primary, #303133);
}
.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}
.login-form :deep(.el-form-item__label) {
  margin-bottom: 6px;
  padding: 0 0 0 6px;
  line-height: 1.4;
  color: var(--mall-text-secondary, #6b7280);
  font-weight: 500;
}
.pill-input :deep(.el-input__wrapper) {
  height: 48px;
  padding: 4px 18px;
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--mall-border, #dbe4ee) inset;
  background: var(--mall-bg-card, #fff);
  transition: box-shadow 0.15s ease;
}
.pill-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--mall-color-primary-soft-border, #dbe4ee) inset;
}
.pill-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--mall-color-primary) inset,
    0 0 0 3px color-mix(in srgb, var(--mall-color-primary) 18%, transparent);
}
.pill-input :deep(.el-input__inner) {
  height: 40px;
  line-height: 40px;
}
.login-page.dark .pill-input :deep(.el-input__wrapper) {
  background: #0e1116;
  box-shadow: 0 0 0 1px #2c3340 inset;
}
.login-actions {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.login-btn {
  min-width: 120px;
  height: 36px;
  padding: 0 28px;
  border-radius: 999px;
  font-size: 14px;
}
</style>
