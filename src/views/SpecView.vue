<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增规格</el-button>
      <el-button @click="load">刷新</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="sort" label="排序" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? "启用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">
            {{ row.status === 1 ? "停用" : "启用" }}
          </el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑规格' : '新增规格'" width="480px">
      <el-form label-width="88px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="16" show-word-limit placeholder="如 箱、包、件" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
          <span class="tip">越大越靠前</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
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
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createSpec,
  deleteSpec,
  fetchSpecList,
  updateSpec,
  updateSpecStatus,
  type SpecVO,
} from "@/api/spec";

const list = ref<SpecVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

const form = reactive({
  id: 0,
  name: "",
  sort: 0,
  status: 1,
});

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchSpecList();
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = 0;
  form.name = "";
  form.sort = 0;
  form.status = 1;
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function openEdit(row: SpecVO) {
  form.id = row.id;
  form.name = row.name;
  form.sort = row.sort ?? 0;
  form.status = row.status;
  visible.value = true;
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      sort: form.sort,
      status: form.status,
    };
    if (form.id) {
      await updateSpec(form.id, payload);
    } else {
      await createSpec(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: SpecVO) {
  const next = row.status === 1 ? 0 : 1;
  await updateSpecStatus(row.id, next);
  ElMessage.success(next === 1 ? "已启用" : "已停用");
  await load();
}

async function onDelete(row: SpecVO) {
  await ElMessageBox.confirm(`确认删除规格「${row.name}」？已被商品使用的规格无法删除。`, "提示");
  await deleteSpec(row.id);
  ElMessage.success("已删除");
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
.tip {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
</style>
