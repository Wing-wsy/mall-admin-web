<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建角色</el-button>
      <el-button @click="load">刷新</el-button>
      <el-input
        v-model="query.code"
        clearable
        placeholder="编码（模糊）"
        style="width: 160px"
        @keyup.enter="load"
      />
      <el-input
        v-model="query.name"
        clearable
        placeholder="名称（模糊）"
        style="width: 160px"
        @keyup.enter="load"
      />
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 110px">
        <el-option label="正常" :value="1" />
        <el-option label="停用" :value="0" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
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

const query = reactive({
  code: "",
  name: "",
  status: undefined as number | undefined,
});

const form = reactive({
  id: 0,
  code: "",
  name: "",
  remark: "",
  permissionIds: [] as number[],
});

async function loadPermTree() {
  const { data } = await fetchPermissionTree();
  permTree.value = data.data || [];
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchRoleList({
      code: query.code.trim() || undefined,
      name: query.name.trim() || undefined,
      status: query.status,
    });
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.code = "";
  query.name = "";
  query.status = undefined;
  load();
}

function collectLeafCheckedKeys(nodes: PermissionNode[], selected: Set<number>): number[] {
  const keys: number[] = [];
  const walk = (items: PermissionNode[]) => {
    for (const n of items) {
      if (n.children?.length) {
        walk(n.children);
      } else if (selected.has(n.id)) {
        keys.push(n.id);
      }
    }
  };
  walk(nodes);
  return keys;
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
  nextTick(() => {
    const selected = new Set(form.permissionIds);
    treeRef.value?.setCheckedKeys(collectLeafCheckedKeys(permTree.value, selected));
  });
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

onMounted(async () => {
  await loadPermTree();
  await load();
});
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
