<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreateRoot">新增一级</el-button>
      <el-button @click="load">刷新</el-button>
      <span v-if="isFestival" class="hint">节日起止时间配在一级；过期后小程序自动隐藏，商品关联保留</span>
    </div>

    <el-table
      :data="tree"
      v-loading="loading"
      border
      stripe
      row-key="id"
      default-expand-all
      :tree-props="{ children: 'children' }"
    >
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column label="层级" width="90">
        <template #default="{ row }">
          {{ row.parentId ? "二级" : "一级" }}
        </template>
      </el-table-column>
      <el-table-column v-if="isFestival" label="有效期" min-width="220">
        <template #default="{ row }">
          <template v-if="!row.parentId">
            <div>{{ formatTime(row.startTime) }} ~</div>
            <div>{{ formatTime(row.endTime) }}</div>
            <el-tag size="small" :type="row.activeWindow ? 'success' : 'info'" style="margin-top: 4px">
              {{ row.activeWindow ? "进行中" : "未开始/已结束" }}
            </el-tag>
          </template>
          <span v-else class="muted">继承一级</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? "启用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button v-if="!row.parentId" link type="primary" @click="openCreateChild(row)">加二级</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? "停用" : "启用" }}</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="dialogTitle" width="520px">
      <el-form label-width="96px">
        <el-form-item v-if="form.parentId" label="所属一级">
          <el-input :model-value="parentName" disabled />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item v-if="isFestival && !form.parentId" label="起止时间" required>
          <el-date-picker
            v-model="form.range"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
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
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  CATEGORY_TYPE_FESTIVAL,
  createCategory,
  deleteCategory,
  fetchCategoryTree,
  updateCategory,
  updateCategoryStatus,
  type CategoryTreeVO,
} from "@/api/category";

const props = defineProps<{
  type: number;
}>();

const isFestival = computed(() => props.type === CATEGORY_TYPE_FESTIVAL);
const tree = ref<CategoryTreeVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const parentName = ref("");

const form = reactive({
  id: 0,
  parentId: 0,
  name: "",
  sort: 0,
  status: 1,
  range: [] as string[],
});

const dialogTitle = computed(() => {
  if (form.id) return "编辑分类";
  return form.parentId ? "新增二级分类" : "新增一级分类";
});

function formatTime(v?: string) {
  return v || "-";
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchCategoryTree(props.type);
    tree.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = 0;
  form.parentId = 0;
  form.name = "";
  form.sort = 0;
  form.status = 1;
  form.range = [];
  parentName.value = "";
}

function openCreateRoot() {
  resetForm();
  visible.value = true;
}

function openCreateChild(row: CategoryTreeVO) {
  resetForm();
  form.parentId = row.id;
  parentName.value = row.name;
  visible.value = true;
}

function openEdit(row: CategoryTreeVO) {
  form.id = row.id;
  form.parentId = row.parentId || 0;
  form.name = row.name;
  form.sort = row.sort ?? 0;
  form.status = row.status;
  parentName.value = "";
  if (!row.parentId && row.startTime && row.endTime) {
    form.range = [row.startTime, row.endTime];
  } else {
    form.range = [];
  }
  if (row.parentId) {
    const root = tree.value.find((r) => r.id === row.parentId);
    parentName.value = root?.name || "";
  }
  visible.value = true;
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  if (isFestival.value && !form.parentId) {
    if (!form.range || form.range.length !== 2) {
      ElMessage.warning("请设置节日起止时间");
      return;
    }
  }
  saving.value = true;
  try {
    const payload = {
      type: props.type,
      parentId: form.parentId || 0,
      name: form.name.trim(),
      sort: form.sort,
      status: form.status,
      startTime: isFestival.value && !form.parentId ? form.range[0] : undefined,
      endTime: isFestival.value && !form.parentId ? form.range[1] : undefined,
    };
    if (form.id) {
      await updateCategory(form.id, payload);
    } else {
      await createCategory(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: CategoryTreeVO) {
  const next = row.status === 1 ? 0 : 1;
  await updateCategoryStatus(row.id, next);
  ElMessage.success(next === 1 ? "已启用" : "已停用");
  await load();
}

async function onDelete(row: CategoryTreeVO) {
  await ElMessageBox.confirm(`确认删除「${row.name}」？`, "提示", { type: "warning" });
  await deleteCategory(row.id);
  ElMessage.success("已删除");
  await load();
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.hint {
  color: #6b7280;
  font-size: 13px;
}
.tip {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.muted {
  color: #9ca3af;
}
</style>
