<template>
  <el-card v-loading="loading" class="card">
    <template #header>客服配置</template>
    <p class="hint">客服信息展示在小程序「我的 - 联系客服」；公告展示在首页搜索栏下方小喇叭。均可留空。</p>
    <el-form label-width="96px" style="max-width: 560px">
      <el-form-item label="客服电话">
        <el-input v-model="form.csPhone" maxlength="32" placeholder="如 400-800-1234" />
      </el-form-item>
      <el-form-item label="客服邮箱">
        <el-input v-model="form.csEmail" maxlength="128" placeholder="如 service@example.com" />
      </el-form-item>
      <el-form-item label="首页公告">
        <el-input
          v-model="form.notice"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="展示在首页搜索栏下方，留空则不显示"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchShopConfig, saveShopConfig } from "@/api/shop";

const loading = ref(false);
const saving = ref(false);
const form = reactive({
  csPhone: "",
  csEmail: "",
  notice: "",
});

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchShopConfig();
    form.csPhone = data.data?.csPhone || "";
    form.csEmail = data.data?.csEmail || "";
    form.notice = data.data?.notice || "";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const { data } = await saveShopConfig({
      csPhone: form.csPhone.trim(),
      csEmail: form.csEmail.trim(),
      notice: form.notice.trim(),
    });
    form.csPhone = data.data?.csPhone || "";
    form.csEmail = data.data?.csEmail || "";
    form.notice = data.data?.notice || "";
    ElMessage.success("已保存");
  } catch {
    // interceptor already toasted
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.card {
  max-width: 640px;
}
.hint {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 13px;
}
</style>
