<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建商户</el-button>
      <el-button @click="load">刷新</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="编码" width="120" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">{{ row.type === 1 ? "平台" : "商户" }}</template>
      </el-table-column>
      <el-table-column prop="contactName" label="联系人" width="120" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? "正常" : "停用" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" :disabled="row.type === 1" @click="openEdit(row)">编辑</el-button>
          <el-button link :disabled="row.type === 1" @click="toggleStatus(row)">
            {{ row.status === 1 ? "停用" : "启用" }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑租户' : '新建商户'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { createTenant, fetchTenantList, updateTenant, updateTenantStatus, type TenantVO } from "@/api/tenant";

const list = ref<TenantVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const form = reactive({
  id: 0,
  code: "",
  name: "",
  contactName: "",
  contactPhone: "",
});

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchTenantList();
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { id: 0, code: "", name: "", contactName: "", contactPhone: "" });
  visible.value = true;
}

function openEdit(row: TenantVO) {
  Object.assign(form, {
    id: row.id,
    code: row.code,
    name: row.name,
    contactName: row.contactName || "",
    contactPhone: row.contactPhone || "",
  });
  visible.value = true;
}

async function save() {
  if (!form.code.trim() || !form.name.trim()) {
    ElMessage.warning("请填写编码和名称");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      code: form.code,
      name: form.name,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
    };
    if (form.id) await updateTenant(form.id, payload);
    else {
      const { data } = await createTenant(payload);
      ElMessage.success(`已创建，默认管理员 ${data.data.code}_admin / admin123`);
    }
    if (form.id) ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: TenantVO) {
  const next = row.status === 1 ? 0 : 1;
  await updateTenantStatus(row.id, next);
  ElMessage.success("已更新");
  await load();
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
</style>
