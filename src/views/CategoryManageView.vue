<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreateRoot">新增一级</el-button>
      <el-button @click="load">刷新</el-button>
      <span class="hint">商品只能挂在没有子分类的末级；给已有商品的分类加子级时，会把商品转到新分类</span>
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
          {{ levelLabel(row.level) }}
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
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="(row.level || 1) < MAX_LEVEL"
            link
            type="primary"
            @click="openCreateChild(row)"
          >
            添加子分类
          </el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? "停用" : "启用" }}</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="dialogTitle" width="520px">
      <el-form label-width="96px">
        <el-form-item v-if="form.parentId" label="上级分类">
          <el-input :model-value="parentName" disabled />
        </el-form-item>
        <el-alert
          v-if="!form.id && parentBoundCount > 0"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
          :title="`「${parentName}」下已有 ${parentBoundCount} 个商品。保存后这些商品将全部转到新分类。`"
        />
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item v-if="form.parentId" label="图标">
          <div class="upload-row">
            <el-upload :show-file-list="false" :http-request="onUploadIcon" accept="image/*">
              <el-button>上传图标</el-button>
            </el-upload>
            <el-button v-if="form.iconUrl" link type="danger" @click="form.iconUrl = ''">清除</el-button>
            <el-image
              v-if="form.iconUrl"
              :src="form.iconUrl"
              style="width: 48px; height: 48px"
              fit="cover"
            />
          </div>
          <div class="tip block">小程序二级及以下分类展示；建议正方形，约 96×96</div>
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
        <el-button type="primary" :loading="saving" @click="save">
          {{ !form.id && parentBoundCount > 0 ? "转移到新分类并保存" : "保存" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import {
  CATEGORY_TYPE_FESTIVAL,
  createCategory,
  deleteCategory,
  fetchCategoryTree,
  updateCategory,
  updateCategoryStatus,
  type CategoryTreeVO,
} from "@/api/category";
import { uploadAdminFile } from "@/api/product";

const MAX_LEVEL = 5;
const LEVEL_NAMES = ["", "一级", "二级", "三级", "四级", "五级"];

const props = defineProps<{
  type: number;
}>();

const isFestival = computed(() => props.type === CATEGORY_TYPE_FESTIVAL);
const tree = ref<CategoryTreeVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const parentName = ref("");
const parentBoundCount = ref(0);

const form = reactive({
  id: 0,
  parentId: 0,
  name: "",
  iconUrl: "",
  sort: 0,
  status: 1,
  range: [] as string[],
});

const dialogTitle = computed(() => {
  if (form.id) return "编辑分类";
  return form.parentId ? "新增子分类" : "新增一级分类";
});

function levelLabel(level?: number) {
  if (!level) return "一级";
  return LEVEL_NAMES[level] || `${level}级`;
}

function formatTime(v?: string) {
  return v || "-";
}

function findNode(nodes: CategoryTreeVO[], id: number): CategoryTreeVO | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = findNode(node.children || [], id);
    if (hit) return hit;
  }
  return undefined;
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
  form.iconUrl = "";
  form.sort = 0;
  form.status = 1;
  form.range = [];
  parentName.value = "";
  parentBoundCount.value = 0;
}

function openCreateRoot() {
  resetForm();
  visible.value = true;
}

function isLeafNode(row: CategoryTreeVO) {
  if (row.leaf === false) return false;
  if (row.leaf === true) return true;
  return !(row.children && row.children.length);
}

function boundCountOf(row: CategoryTreeVO) {
  const n = Number(row.boundCount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function currentParentBoundCount() {
  if (!form.parentId) return 0;
  const parent = findNode(tree.value, form.parentId);
  if (!parent) return parentBoundCount.value;
  if (!isLeafNode(parent)) return 0;
  return boundCountOf(parent) || parentBoundCount.value;
}

function transferErrorCount(err: unknown) {
  const msg = (err as { message?: string } | undefined)?.message || "";
  const hit = msg.match(/有(\d+)个商品/);
  if (hit) return Number(hit[1]) || 0;
  return msg.includes("转移到新分类") ? 1 : 0;
}

async function confirmTransfer(count: number) {
  try {
    await ElMessageBox.confirm(
      `「${parentName.value}」下已有 ${count} 个商品。添加子分类后该分类不再是叶子，这些商品将全部转移到新分类「${form.name.trim()}」。是否继续？`,
      "转移商品确认",
      {
        type: "warning",
        confirmButtonText: "转移到新分类",
        cancelButtonText: "取消",
      }
    );
    return true;
  } catch {
    return false;
  }
}

function openCreateChild(row: CategoryTreeVO) {
  if ((row.level || 1) >= MAX_LEVEL) {
    ElMessage.warning(`最多支持${MAX_LEVEL}级分类`);
    return;
  }
  resetForm();
  form.parentId = row.id;
  parentName.value = row.name;
  parentBoundCount.value = isLeafNode(row) ? boundCountOf(row) : 0;
  visible.value = true;
}

function openEdit(row: CategoryTreeVO) {
  form.id = row.id;
  form.parentId = row.parentId || 0;
  form.name = row.name;
  form.iconUrl = row.iconUrl || "";
  form.sort = row.sort ?? 0;
  form.status = row.status;
  parentBoundCount.value = 0;
  if (!row.parentId && row.startTime && row.endTime) {
    form.range = [row.startTime, row.endTime];
  } else {
    form.range = [];
  }
  if (row.parentId) {
    parentName.value = findNode(tree.value, row.parentId)?.name || "";
  } else {
    parentName.value = "";
  }
  visible.value = true;
}

async function onUploadIcon(options: UploadRequestOptions) {
  const { data } = await uploadAdminFile(options.file as File, "category");
  form.iconUrl = data.data.url;
  ElMessage.success("上传成功");
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
  const addingChild = !form.id && !!form.parentId;
  let moveProducts = false;
  const knownCount = addingChild ? currentParentBoundCount() : 0;
  if (addingChild && knownCount > 0) {
    if (!(await confirmTransfer(knownCount))) return;
    moveProducts = true;
    parentBoundCount.value = knownCount;
  }
  saving.value = true;
  try {
    const payload = {
      type: props.type,
      parentId: form.parentId || 0,
      name: form.name.trim(),
      iconUrl: form.parentId ? form.iconUrl || undefined : undefined,
      sort: form.sort,
      status: form.status,
      startTime: isFestival.value && !form.parentId ? form.range[0] : undefined,
      endTime: isFestival.value && !form.parentId ? form.range[1] : undefined,
      moveProducts: moveProducts || undefined,
    };
    if (form.id) {
      await updateCategory(form.id, payload);
    } else {
      try {
        await createCategory(payload, addingChild && !moveProducts ? { skipErrorMessage: true } : undefined);
      } catch (err) {
        const retryCount = transferErrorCount(err);
        if (!addingChild || moveProducts || retryCount <= 0) {
          ElMessage.error((err as { message?: string })?.message || "保存失败");
          return;
        }
        parentBoundCount.value = retryCount;
        if (!(await confirmTransfer(retryCount))) return;
        await createCategory({ ...payload, moveProducts: true });
      }
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
.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tip.block {
  display: block;
  margin: 8px 0 0;
}
</style>
