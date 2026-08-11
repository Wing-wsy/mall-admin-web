<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>联调探测 · mall-admin-api</span>
        <el-button type="primary" :loading="loading" @click="runPing">请求 /ping</el-button>
      </div>
    </template>
    <el-alert
      v-if="error"
      type="error"
      :title="error"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
    />
    <pre v-if="result" class="result">{{ result }}</pre>
    <el-empty v-else description="点击上方按钮探测 9082" />
  </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { pingAdminApi } from "@/api/system";

const loading = ref(false);
const result = ref("");
const error = ref("");

async function runPing() {
  loading.value = true;
  error.value = "";
  result.value = "";
  try {
    const { data } = await pingAdminApi();
    result.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    error.value = e?.message || "请求失败，请确认 mall-admin-api 已启动";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result {
  margin: 0;
  padding: 16px;
  background: #0b1020;
  color: #d1fae5;
  border-radius: 8px;
  overflow: auto;
}
</style>
