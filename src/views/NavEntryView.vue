<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增导航</el-button>
      <el-button @click="load">刷新</el-button>
      <span class="hint">小程序首页按 2 行 5 列分页展示；图标走「图标套装」槽位，换套不必改这里。覆盖图仅在该格子要单独换图时上传</span>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="图标" width="90">
        <template #default="{ row }">
          <el-image
            v-if="row.iconUrl"
            :src="row.iconUrl"
            style="width: 40px; height: 40px"
            fit="contain"
          />
          <span v-else class="muted">套装</span>
        </template>
      </el-table-column>
      <el-table-column prop="iconKey" label="槽位" width="130" />
      <el-table-column prop="title" label="名称" min-width="120" />
      <el-table-column label="跳转" min-width="220">
        <template #default="{ row }">
          <el-tag size="small">{{ linkTypeLabel(row.linkType) }}</el-tag>
          <span v-if="row.linkLabel" class="link-label">{{ row.linkLabel }}</span>
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
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="load"
        @size-change="search"
      />
    </div>

    <el-dialog v-model="visible" :title="form.id ? '编辑导航' : '新增导航'" width="560px">
      <el-form label-width="96px">
        <el-form-item label="名称" required>
          <el-input v-model="form.title" maxlength="8" show-word-limit placeholder="如 全部分类" @change="onTitleChange" />
        </el-form-item>
        <el-form-item label="槽位">
          <el-select
            v-model="form.iconKey"
            filterable
            allow-create
            default-first-option
            clearable
            placeholder="对齐套装素材，如 all_category"
            style="width: 100%"
          >
            <el-option
              v-for="slot in navSlots"
              :key="slot.key"
              :label="`${slot.label}（${slot.key}）`"
              :value="slot.key"
            />
          </el-select>
          <div class="tip block">不填覆盖图时，小程序使用当前启用套装里该槽位的图</div>
        </el-form-item>
        <el-form-item label="覆盖图标">
          <div class="upload-row">
            <el-upload :show-file-list="false" :http-request="onUpload" accept="image/*">
              <el-button>上传覆盖图</el-button>
            </el-upload>
            <el-button v-if="form.iconUrl" link type="danger" @click="form.iconUrl = ''">清除</el-button>
            <el-image
              v-if="form.iconUrl"
              :src="form.iconUrl"
              style="width: 48px; height: 48px"
              fit="contain"
            />
          </div>
          <div class="tip block">仅该格子要脱离套装时上传；建议正方形、透明底，约 80×80</div>
        </el-form-item>
        <el-form-item label="跳转类型" required>
          <el-select v-model="form.linkType" style="width: 100%" @change="onLinkTypeChange">
            <el-option
              v-for="opt in linkTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.linkType === 'product'" label="关联商品" required>
          <el-select v-model="form.productId" filterable placeholder="选择商品" style="width: 100%">
            <el-option
              v-for="p in products"
              :key="p.id"
              :label="`${p.name} (#${p.id})`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.linkType === 'goodsList'" label="商品分类" required>
          <el-cascader
            v-model="form.categoryId"
            :options="productTree"
            :props="categoryCascaderProps"
            filterable
            clearable
            placeholder="选择末级分类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="form.linkType === 'festivalGoods'" label="节日分类" required>
          <el-cascader
            v-model="form.festivalCategoryId"
            :options="festivalTree"
            :props="categoryCascaderProps"
            filterable
            clearable
            placeholder="选择末级分类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="form.linkType === 'page'" label="页面路径" required>
          <el-input v-model="form.pagePath" placeholder="/pages/goods/list" />
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
import { computed, onActivated, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import {
  createNavEntry,
  deleteNavEntry,
  fetchNavEntryList,
  updateNavEntry,
  type NavEntryVO,
} from "@/api/navEntry";
import {
  CATEGORY_TYPE_FESTIVAL,
  CATEGORY_TYPE_PRODUCT,
  fetchCategoryTree,
  type CategoryTreeVO,
} from "@/api/category";
import { fetchProductList, uploadAdminFile, type ProductVO } from "@/api/product";
import { asPage } from "@/utils/page";

interface TreeOption {
  value: number;
  label: string;
  disabled?: boolean;
  children?: TreeOption[];
}

const linkTypeOptions = [
  { value: "category", label: "分类页" },
  { value: "festival", label: "节日页" },
  { value: "goodsList", label: "商品列表（商品分类）" },
  { value: "festivalGoods", label: "商品列表（节日分类）" },
  { value: "product", label: "商品详情" },
  { value: "page", label: "指定页面" },
  { value: "none", label: "暂不跳转" },
];

const categoryCascaderProps = {
  value: "value",
  label: "label",
  children: "children",
  disabled: "disabled",
  emitPath: false,
} as const;

const list = ref<NavEntryVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const navSlots = computed(() => {
  const seen = new Set<string>();
  const slots: { key: string; label: string }[] = [];
  for (const item of list.value) {
    const key = (item.iconKey || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    slots.push({ key, label: item.title || key });
  }
  return slots;
});
const products = ref<ProductVO[]>([]);
const productTree = ref<TreeOption[]>([]);
const festivalTree = ref<TreeOption[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

const form = reactive({
  id: 0,
  title: "",
  iconUrl: "",
  iconKey: "",
  linkType: "category",
  productId: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  festivalCategoryId: undefined as number | undefined,
  pagePath: "",
  sort: 0,
  status: 1,
});

function linkTypeLabel(type: string) {
  return linkTypeOptions.find((item) => item.value === type)?.label || type;
}

function toSelectTree(nodes: CategoryTreeVO[], parentDisabled = false): TreeOption[] {
  return (nodes || []).map((node) => {
    const disabled = parentDisabled || node.status !== 1;
    const children = toSelectTree(node.children || [], disabled);
    const option: TreeOption = {
      value: node.id,
      label: node.name,
      disabled,
    };
    if (children.length) {
      option.children = children;
    }
    return option;
  });
}

async function loadOptions() {
  const [productRes, treeRes, festivalRes] = await Promise.all([
    fetchProductList({ pageSize: 500 }),
    fetchCategoryTree(CATEGORY_TYPE_PRODUCT),
    fetchCategoryTree(CATEGORY_TYPE_FESTIVAL),
  ]);
  products.value = asPage<ProductVO>(productRes.data?.data).records;
  productTree.value = toSelectTree(treeRes.data.data || []);
  festivalTree.value = toSelectTree(festivalRes.data.data || []);
}

async function load() {
  loading.value = true;
  try {
    const res = await fetchNavEntryList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    // Compatible with ApiResult<PageResult> and accidental unwrapped payloads.
    const payload = res.data?.data ?? res.data;
    const page = asPage<NavEntryVO>(payload);
    list.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNum.value = 1;
  load();
}

function resetForm() {
  form.id = 0;
  form.title = "";
  form.iconUrl = "";
  form.iconKey = "";
  form.linkType = "category";
  form.productId = products.value[0]?.id;
  form.categoryId = undefined;
  form.festivalCategoryId = undefined;
  form.pagePath = "";
  form.sort = 0;
  form.status = 1;
}

function onLinkTypeChange() {
  form.productId = products.value[0]?.id;
  form.categoryId = undefined;
  form.festivalCategoryId = undefined;
  form.pagePath = "";
}

async function openCreate() {
  await loadOptions();
  resetForm();
  visible.value = true;
}

async function openEdit(row: NavEntryVO) {
  await loadOptions();
  form.id = row.id;
  form.title = row.title || "";
  form.iconUrl = row.iconUrl || "";
  form.iconKey = row.iconKey || "";
  form.linkType = row.linkType || "none";
  form.productId = row.linkType === "product" ? Number(row.linkValue) : products.value[0]?.id;
  form.categoryId = row.linkType === "goodsList" ? Number(row.linkValue) : undefined;
  form.festivalCategoryId = row.linkType === "festivalGoods" ? Number(row.linkValue) : undefined;
  form.pagePath = row.linkType === "page" ? row.linkValue || "" : "";
  form.sort = row.sort ?? 0;
  form.status = row.status;
  visible.value = true;
}

function onTitleChange() {
  if (form.id || form.iconKey) return;
  const hit = navSlots.value.find((s) => s.label === form.title.trim());
  if (hit) form.iconKey = hit.key;
}

async function onUpload(options: UploadRequestOptions) {
  const { data } = await uploadAdminFile(options.file as File, "nav");
  form.iconUrl = data.data.url;
  ElMessage.success("上传成功");
}

function resolveLinkValue() {
  switch (form.linkType) {
    case "product":
      return form.productId ? String(form.productId) : "";
    case "goodsList":
      return form.categoryId ? String(form.categoryId) : "";
    case "festivalGoods":
      return form.festivalCategoryId ? String(form.festivalCategoryId) : "";
    case "page":
      return form.pagePath.trim();
    default:
      return "";
  }
}

async function save() {
  if (!form.title.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  const linkValue = resolveLinkValue();
  if (form.linkType === "product" && !form.productId) {
    ElMessage.warning("请选择关联商品");
    return;
  }
  if (form.linkType === "goodsList" && !form.categoryId) {
    ElMessage.warning("请选择商品分类");
    return;
  }
  if (form.linkType === "festivalGoods" && !form.festivalCategoryId) {
    ElMessage.warning("请选择节日分类");
    return;
  }
  if (form.linkType === "page" && !linkValue.startsWith("/pages/")) {
    ElMessage.warning("请填写小程序页面路径，如 /pages/goods/list");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: form.title.trim(),
      iconUrl: form.iconUrl,
      iconKey: form.iconKey,
      linkType: form.linkType,
      linkValue,
      sort: form.sort,
      status: form.status,
    };
    if (form.id) {
      await updateNavEntry(form.id, payload);
    } else {
      await createNavEntry(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function onDelete(row: NavEntryVO) {
  await ElMessageBox.confirm(`确认删除导航「${row.title}」？`, "提示");
  await deleteNavEntry(row.id);
  ElMessage.success("已删除");
  await load();
}

onMounted(load);
onActivated(load);
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tip {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.tip.block {
  margin: 6px 0 0;
}
.hint {
  color: #9ca3af;
  font-size: 12px;
}
.muted {
  color: #9ca3af;
}
.link-label {
  margin-left: 8px;
  color: #6b7280;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
