<template>
  <div class="login-page">
    <el-card class="login-card" shadow="never">
      <h2>Mall Admin</h2>
      <p class="hint">多商户入驻 · 试用 admin / merchant / ops（密码均为 admin123）</p>
      <el-form @submit.prevent>
        <el-form-item label="账号">
          <el-input v-model="username" placeholder="merchant" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password placeholder="admin123" />
        </el-form-item>
        <el-button type="primary" style="width: 100%" :loading="loading" @click="onLogin">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { loginAdmin } from "@/api/auth";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();
const username = ref("merchant");
const password = ref("admin123");
const loading = ref(false);

onMounted(() => {
  userStore.logout();
});

async function onLogin() {
  loading.value = true;
  try {
    const { data } = await loginAdmin(username.value.trim(), password.value);
    if (!data?.data?.token) {
      ElMessage.error("登录响应异常");
      return;
    }
    userStore.login(data.data);
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
.login-card {
  width: 400px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
}
.login-card :deep(.el-card__body) {
  padding: 28px 28px 22px;
}
h2 {
  margin: 0 0 12px;
  text-align: center;
  font-size: 22px;
  font-weight: 500;
  color: #303133;
}
.hint {
  color: #6b7280;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 13px;
  text-align: center;
}
</style>
