<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2>Mall Admin</h2>
      <p class="hint">框架期登录壳，暂不接真实鉴权</p>
      <el-form @submit.prevent>
        <el-form-item label="账号">
          <el-input v-model="username" placeholder="admin" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password placeholder="任意" />
        </el-form-item>
        <el-button type="primary" style="width: 100%" @click="onLogin">进入后台</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();
const username = ref("admin");
const password = ref("admin123");

function onLogin() {
  userStore.login(username.value || "admin", `skeleton-token-${Date.now()}`);
  router.push("/dashboard");
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #0f172a, #1e293b 45%, #334155);
}

.login-card {
  width: 380px;
}

.hint {
  color: #6b7280;
  margin-top: -8px;
  margin-bottom: 20px;
}
</style>
