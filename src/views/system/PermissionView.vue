<template>
  <div ref="pageRef">
    <div class="toolbar" data-sticky-chrome>
      <el-button type="primary" @click="openCreate(null)">新建顶级菜单</el-button>
      <el-button @click="load">刷新</el-button>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="权限目录变更后，请重新登录或刷新资料以更新侧栏；新建菜单 path 须已有前端路由，否则会 404。"
        style="flex: 1; min-width: 280px"
      />
    </div>

    <div class="page-body">
    <el-table :data="tree"
      v-loading="loading"
      border
      stripe
      row-key="id"
      :tree-props="{ children: 'children' }" :height="tableHeight">
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="code" label="编码" min-width="180" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          {{ row.type === 1 ? "菜单" : "按钮" }}
        </template>
      </el-table-column>
      <el-table-column prop="path" label="路由 path" min-width="140" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? "正常" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="360" fixed="right">
        <template #default="{ row }">
          <div class="table-ops">
            <OpBtn v-if="row.type === 1" icon="Plus" @click="openCreate(row)">加子级</OpBtn>
            <OpBtn icon="Edit" @click="openEdit(row)">编辑</OpBtn>
            <OpBtn
              :icon="row.status === 1 ? 'CircleClose' : 'Select'"
              :variant="row.status === 1 ? 'danger' : 'solid'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? "停用" : "启用" }}
            </OpBtn>
            <OpBtn icon="Delete" variant="danger" @click="onDelete(row)">删除</OpBtn>
          </div>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <el-dialog v-model="visible" :title="form.id ? '编辑权限' : '新建权限'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="编码" required>
          <el-input
            v-model="form.code"
            :disabled="!!form.id"
            placeholder="如 product:list，创建后不可改"
          />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="form.type" :disabled="!!form.id">
            <el-radio :value="1">菜单</el-radio>
            <el-radio :value="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="父节点">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            check-strictly
            clearable
            filterable
            :render-after-expand="false"
            placeholder="空为顶级"
            style="width: 100%"
            :props="{ label: 'name', value: 'id', children: 'children' }"
          />
        </el-form-item>
        <el-form-item v-if="form.type === 1" label="path">
          <el-input v-model="form.path" placeholder="叶子菜单如 /products；目录可空" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
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
import { useStickyTable } from "@/composables/useStickyTable";
import OpBtn from "@/components/OpBtn.vue";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {

  createPermission,
  deletePermission,
  fetchPermissionManageTree,
  updatePermission,
  updatePermissionStatus,
  type PermissionNode,
} from "@/api/permission";
import { fetchAdminMe } from "@/api/auth";
import { useUserStore } from "@/stores/user";

const { pageRef, tableHeight, syncTableHeightNextTick } = useStickyTable();

const userStore = useUserStore();
const tree = ref<PermissionNode[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

const form = reactive({
  id: 0,
  code: "",
  name: "",
  type: 1,
  parentId: undefined as number | undefined,
  path: "",
  sort: 0,
  status: 1,
});

/** 父节点选择：仅菜单；编辑时排除自己及子孙，避免成环 */
const parentOptions = computed(() => {
  const exclude = new Set<number>();
  if (form.id) {
    const find = (nodes: PermissionNode[]): PermissionNode | null => {
      for (const n of nodes) {
        if (n.id === form.id) return n;
        if (n.children?.length) {
          const hit = find(n.children);
          if (hit) return hit;
        }
      }
      return null;
    };
    const walkDown = (n: PermissionNode) => {
      exclude.add(n.id);
      n.children?.forEach(walkDown);
    };
    const self = find(tree.value);
    if (self) walkDown(self);
  }

  const mapMenus = (nodes: PermissionNode[]): PermissionNode[] =>
    nodes
      .filter((n) => n.type === 1 && !exclude.has(n.id))
      .map((n) => ({
        ...n,
        children: n.children?.length ? mapMenus(n.children) : [],
      }));
  return mapMenus(tree.value);
});

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchPermissionManageTree();
    tree.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

async function refreshProfile() {
  try {
    const { data } = await fetchAdminMe();
    if (data?.data) {
      userStore.login(data.data);
    }
  } catch {
    ElMessage.info("权限已保存，请重新登录以刷新侧栏");
  }
}

function openCreate(parent: PermissionNode | null) {
  Object.assign(form, {
    id: 0,
    code: "",
    name: "",
    type: 1,
    parentId: parent?.id,
    path: "",
    sort: 0,
    status: 1,
  });
  visible.value = true;
}

function openEdit(row: PermissionNode) {
  Object.assign(form, {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    parentId: row.parentId && row.parentId > 0 ? row.parentId : undefined,
    path: row.path || "",
    sort: row.sort ?? 0,
    status: row.status ?? 1,
  });
  visible.value = true;
}

async function save() {
  if (!form.id && !form.code.trim()) {
    ElMessage.warning("请填写编码");
    return;
  }
  if (!form.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      parentId: form.parentId || 0,
      path: form.type === 1 ? form.path.trim() || null : null,
      sort: form.sort,
      status: form.status,
    };
    if (form.id) {
      await updatePermission(form.id, payload);
    } else {
      await createPermission(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
    await refreshProfile();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: PermissionNode) {
  const next = row.status === 1 ? 0 : 1;
  await ElMessageBox.confirm(
    `确认将「${row.name}」${next === 1 ? "启用" : "停用"}？`,
    "提示"
  );
  await updatePermissionStatus(row.id, next);
  ElMessage.success("已更新");
  await load();
  await refreshProfile();
}

async function onDelete(row: PermissionNode) {
  await ElMessageBox.confirm(`确认删除权限「${row.name}」（${row.code}）？`, "提示", {
    type: "warning",
  });
  await deletePermission(row.id);
  ElMessage.success("已删除");
  await load();
  await refreshProfile();
}

onMounted(async () => {
  await load();
  await syncTableHeightNextTick();
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
