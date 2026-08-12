<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建角色</el-button>
      <el-button @click="load">刷新</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="编码" width="140" />
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column prop="remark" label="备注" min-width="160" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? "正常" : "停用" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑/授权</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑角色' : '新建角色'" width="560px">
      <el-form label-width="90px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
        <el-form-item label="权限">
          <el-tree
            ref="treeRef"
            :data="permTree"
            node-key="id"
            show-checkbox
            default-expand-all
            :props="{ label: 'name', children: 'children' }"
            style="width: 100%; max-height: 360px; overflow: auto"
          />
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
import { nextTick, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type ElTree } from "element-plus";
import {
  createRole,
  deleteRole,
  fetchPermissionTree,
  fetchRoleList,
  updateRole,
  type PermissionNode,
  type RoleVO,
} from "@/api/role";

const list = ref<RoleVO[]>([]);
const permTree = ref<PermissionNode[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const treeRef = ref<InstanceType<typeof ElTree>>();
const form = reactive({
  id: 0,
  code: "",
  name: "",
  remark: "",
  permissionIds: [] as number[],
});

async function load() {
  loading.value = true;
  try {
    const [roles, tree] = await Promise.all([fetchRoleList(), fetchPermissionTree()]);
    list.value = roles.data.data || [];
    permTree.value = tree.data.data || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { id: 0, code: "", name: "", remark: "", permissionIds: [] });
  visible.value = true;
  nextTick(() => treeRef.value?.setCheckedKeys([]));
}

function openEdit(row: RoleVO) {
  Object.assign(form, {
    id: row.id,
    code: row.code,
    name: row.name,
    remark: row.remark || "",
    permissionIds: [...(row.permissionIds || [])],
  });
  visible.value = true;
  nextTick(() => treeRef.value?.setCheckedKeys(form.permissionIds));
}

async function save() {
  if (!form.code.trim() || !form.name.trim()) {
    ElMessage.warning("请填写编码和名称");
    return;
  }
  const checked = (treeRef.value?.getCheckedKeys(false) as number[]) || [];
  const half = (treeRef.value?.getHalfCheckedKeys() as number[]) || [];
  const permissionIds = [...checked, ...half];
  saving.value = true;
  try {
    const payload = {
      code: form.code,
      name: form.name,
      remark: form.remark,
      permissionIds,
    };
    if (form.id) await updateRole(form.id, payload);
    else await createRole(payload);
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function onDelete(row: RoleVO) {
  await ElMessageBox.confirm(`确认删除角色「${row.name}」？`, "提示");
  await deleteRole(row.id);
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
</style>
