<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增商品</el-button>
      <el-button @click="load">刷新</el-button>
      <el-input
        v-model="query.name"
        clearable
        placeholder="商品名称（模糊）"
        style="width: 180px"
        @keyup.enter="load"
      />
      <el-cascader
        v-model="query.categoryId"
        :options="filterProductTree"
        :props="filterCascaderProps"
        clearable
        filterable
        placeholder="商品分类"
        style="width: 200px"
      />
      <el-cascader
        v-model="query.festivalId"
        :options="filterFestivalTree"
        :props="filterCascaderProps"
        clearable
        filterable
        placeholder="节日分类"
        style="width: 200px"
      />
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 110px">
        <el-option label="上架" :value="1" />
        <el-option label="下架" :value="0" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="封面" width="90">
        <template #default="{ row }">
          <el-image
            v-if="row.coverUrl"
            :src="row.coverUrl"
            style="width: 56px; height: 56px"
            fit="cover"
          />
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column prop="categoryPath" label="商品分类" min-width="140" />
      <el-table-column label="规格" min-width="120">
        <template #default="{ row }">
          <span v-if="row.specSummary">{{ row.specSummary }}</span>
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column label="库存" width="110">
        <template #default="{ row }">
          {{ row.stockSummary || row.stock || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="节日分类" min-width="160">
        <template #default="{ row }">
          <span v-if="row.festivalPaths?.length">{{ row.festivalPaths.join("；") }}</span>
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="现价" width="100" />
      <el-table-column prop="originPrice" label="原价" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? "上架" : "下架" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">
            {{ row.status === 1 ? "下架" : "上架" }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑商品' : '新增商品'" width="1080px">
      <el-form label-width="96px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" />
        </el-form-item>
        <el-form-item label="商品分类" required>
          <el-cascader
            v-model="form.categoryId"
            :options="productTree"
            :props="categoryCascaderProps"
            filterable
            clearable
            placeholder="选择一级 / 二级分类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="节日分类">
          <el-cascader
            v-model="form.festivalIds"
            :options="festivalTree"
            :props="festivalCascaderProps"
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="可多选节日一级 / 二级"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="头图">
          <div class="img-list">
            <div v-for="(url, index) in form.galleryUrls" :key="'g-' + index" class="img-item">
              <el-image :src="url" style="width: 80px; height: 80px" fit="cover" />
              <div class="img-actions">
                <el-button link :disabled="index === 0" @click="moveUrl(form.galleryUrls, index, -1)">前移</el-button>
                <el-button link type="danger" @click="form.galleryUrls.splice(index, 1)">删除</el-button>
              </div>
            </div>
            <el-upload
              v-if="form.galleryUrls.length < 9"
              :show-file-list="false"
              :http-request="(opt: UploadRequestOptions) => onUpload(opt, form.galleryUrls, 9)"
              accept="image/*"
            >
              <el-button>上传</el-button>
            </el-upload>
          </div>
          <div class="tip">建议 1:1（1200×1200），最多 9 张；第一张作为列表封面</div>
        </el-form-item>
        <el-form-item label="现价">
          <span v-if="displayPrice != null" class="price-preview">¥{{ displayPrice }}</span>
          <span v-else class="muted">由启用规格自动计算</span>
          <span v-if="displayOriginPrice != null" class="origin-preview">原价 ¥{{ displayOriginPrice }}</span>
        </el-form-item>
        <el-form-item label="库存" required>
          <el-input-number v-model="form.stock" :min="0" :precision="0" />
          <span class="tip">按库存单位「{{ baseSpecName || "—" }}」计</span>
        </el-form-item>
        <el-form-item label="售卖规格" required>
          <div class="sku-block">
            <el-table :data="form.skus" border size="small">
              <el-table-column label="规格" min-width="120">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.specId"
                    filterable
                    placeholder="选择规格"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="spec in specOptionsForRow($index)"
                      :key="spec.id"
                      :label="spec.name"
                      :value="spec.id"
                      :disabled="spec.status !== 1 && spec.id !== row.specId"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="现价" width="130">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0.01" :precision="2" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column label="原价" width="130">
                <template #default="{ row }">
                  <el-input-number v-model="row.originPrice" :min="0" :precision="2" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column label="库存单位" width="90">
                <template #default="{ $index }">
                  <el-radio :model-value="form.skus[$index].isBase" :value="1" @change="setBase($index)">
                    是
                  </el-radio>
                </template>
              </el-table-column>
              <el-table-column label="换算" width="150">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.convertQty"
                    :min="row.isBase === 1 ? 1 : 2"
                    :precision="0"
                    :disabled="row.isBase === 1"
                    controls-position="right"
                  />
                </template>
              </el-table-column>
              <el-table-column label="计费件数" width="150">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.freightQty"
                    :min="1"
                    :precision="0"
                    controls-position="right"
                  />
                </template>
              </el-table-column>
              <el-table-column label="启用" width="70">
                <template #default="{ row }">
                  <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
                </template>
              </el-table-column>
              <el-table-column label="" width="64">
                <template #default="{ $index }">
                  <el-button link type="danger" @click="removeSkuRow($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="add-sku" @click="addSkuRow">添加规格</el-button>
            <div class="tip">
              必须指定一个库存单位（换算=1）。其它规格填写「1 {{ nonBaseHint }} = N {{ baseSpecName || "库存单位" }}」。
              计费件数：买 1 个按几件收运费，默认 1；大件填 3～5，与库存换算无关。
            </div>
          </div>
        </el-form-item>
        <el-form-item label="详情文案">
          <el-input v-model="form.detailHtml" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="详情图">
          <div class="img-list">
            <div v-for="(url, index) in form.detailImageUrls" :key="'d-' + index" class="img-item">
              <el-image :src="url" style="width: 80px; height: 80px" fit="cover" />
              <div class="img-actions">
                <el-button link :disabled="index === 0" @click="moveUrl(form.detailImageUrls, index, -1)">前移</el-button>
                <el-button link type="danger" @click="form.detailImageUrls.splice(index, 1)">删除</el-button>
              </div>
            </div>
            <el-upload
              v-if="form.detailImageUrls.length < 20"
              :show-file-list="false"
              :http-request="(opt: UploadRequestOptions) => onUpload(opt, form.detailImageUrls, 20)"
              accept="image/*"
            >
              <el-button>上传</el-button>
            </el-upload>
          </div>
          <div class="tip">详情长图，宽 750～1200，最多 20 张</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <ProductDetailDialog v-model="detailVisible" :product-id="detailId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ProductDetailDialog from "@/components/ProductDetailDialog.vue";
import type { UploadRequestOptions } from "element-plus";
import {
  CATEGORY_TYPE_FESTIVAL,
  CATEGORY_TYPE_PRODUCT,
  fetchCategoryTree,
  type CategoryTreeVO,
} from "@/api/category";
import {
  createProduct,
  fetchProductList,
  updateProduct,
  updateProductStatus,
  uploadAdminFile,
  type ProductVO,
} from "@/api/product";
import { fetchSpecList, type SpecVO } from "@/api/spec";

interface SkuRow {
  specId?: number;
  price: number;
  originPrice?: number;
  status: number;
  isBase: number;
  convertQty: number;
  freightQty: number;
}

interface TreeOption {
  value: number;
  label: string;
  disabled?: boolean;
  children?: TreeOption[];
}

const categoryCascaderProps = {
  value: "value",
  label: "label",
  children: "children",
  disabled: "disabled",
  emitPath: false,
} as const;

/** 筛选可选一级或二级 */
const filterCascaderProps = {
  value: "value",
  label: "label",
  children: "children",
  emitPath: false,
  checkStrictly: true,
} as const;

const festivalCascaderProps = {
  value: "value",
  label: "label",
  children: "children",
  disabled: "disabled",
  emitPath: false,
  multiple: true,
} as const;

const list = ref<ProductVO[]>([]);
const productTree = ref<TreeOption[]>([]);
const festivalTree = ref<TreeOption[]>([]);
const filterProductTree = ref<TreeOption[]>([]);
const filterFestivalTree = ref<TreeOption[]>([]);
const specs = ref<SpecVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const detailVisible = ref(false);
const detailId = ref<number>();
const saving = ref(false);

const query = reactive({
  name: "",
  categoryId: undefined as number | undefined,
  festivalId: undefined as number | undefined,
  status: undefined as number | undefined,
});

const form = reactive({
  id: 0,
  name: "",
  subtitle: "",
  coverUrl: "",
  galleryUrls: [] as string[],
  detailHtml: "",
  detailImageUrls: [] as string[],
  status: 1,
  categoryId: undefined as number | undefined,
  festivalIds: [] as number[],
  stock: 0,
  skus: [] as SkuRow[],
});

const enabledSkus = computed(() => form.skus.filter((row) => row.status === 1 && row.price > 0));

const baseSku = computed(() => form.skus.find((row) => row.status === 1 && row.isBase === 1));

const baseSpecName = computed(() => {
  const specId = baseSku.value?.specId;
  return specs.value.find((s) => s.id === specId)?.name || "";
});

const nonBaseHint = computed(() => {
  const row = form.skus.find((s) => s.status === 1 && s.isBase !== 1);
  return specs.value.find((s) => s.id === row?.specId)?.name || "箱";
});

const displayPrice = computed(() => {
  if (!enabledSkus.value.length) {
    return undefined;
  }
  return Math.min(...enabledSkus.value.map((row) => Number(row.price)));
});

const displayOriginPrice = computed(() => {
  const minRow = enabledSkus.value.reduce<SkuRow | undefined>((best, row) => {
    if (!best || Number(row.price) < Number(best.price)) {
      return row;
    }
    return best;
  }, undefined);
  return minRow?.originPrice != null ? Number(minRow.originPrice) : undefined;
});

/** 级联选项：回显自动展示「一级 / 二级」；只能选到叶子 */
function toSelectTree(nodes: CategoryTreeVO[]): TreeOption[] {
  return (nodes || [])
    .filter((root) => (root.children || []).length > 0)
    .map((root) => ({
      value: root.id,
      label: root.name,
      disabled: root.status !== 1,
      children: (root.children || []).map((leaf) => ({
        value: leaf.id,
        label: leaf.name,
        disabled: root.status !== 1 || leaf.status !== 1,
      })),
    }));
}

/** 筛选树：可选一级（含其下全部二级）或二级 */
function toFilterTree(nodes: CategoryTreeVO[]): TreeOption[] {
  return (nodes || []).map((root) => ({
    value: root.id,
    label: root.name,
    children: (root.children || []).map((leaf) => ({
      value: leaf.id,
      label: leaf.name,
    })),
  }));
}

async function loadTrees() {
  const [p, f] = await Promise.all([
    fetchCategoryTree(CATEGORY_TYPE_PRODUCT),
    fetchCategoryTree(CATEGORY_TYPE_FESTIVAL),
  ]);
  const productNodes = p.data.data || [];
  const festivalNodes = f.data.data || [];
  productTree.value = toSelectTree(productNodes);
  festivalTree.value = toSelectTree(festivalNodes);
  filterProductTree.value = toFilterTree(productNodes);
  filterFestivalTree.value = toFilterTree(festivalNodes);
  try {
    const s = await fetchSpecList();
    specs.value = s.data.data || [];
  } catch {
    specs.value = [];
  }
}

function emptySkuRow(specId?: number, isBase = 0): SkuRow {
  return {
    specId,
    price: 1,
    originPrice: undefined,
    status: 1,
    isBase,
    convertQty: isBase === 1 ? 1 : 12,
    freightQty: 1,
  };
}

function setBase(index: number) {
  form.skus.forEach((row, i) => {
    if (i === index) {
      row.isBase = 1;
      row.convertQty = 1;
    } else {
      row.isBase = 0;
      if (!row.convertQty || row.convertQty < 2) {
        row.convertQty = 12;
      }
    }
  });
}

function removeSkuRow(index: number) {
  const wasBase = form.skus[index]?.isBase === 1;
  form.skus.splice(index, 1);
  if (wasBase && form.skus.length) {
    const firstEnabled = form.skus.findIndex((row) => row.status === 1);
    setBase(firstEnabled >= 0 ? firstEnabled : 0);
  }
}

function unusedEnabledSpecs(exceptIndex = -1) {
  const used = new Set(
    form.skus
      .filter((_, i) => i !== exceptIndex)
      .map((row) => row.specId)
      .filter((id): id is number => id != null)
  );
  return specs.value.filter((spec) => spec.status === 1 && !used.has(spec.id));
}

function specOptionsForRow(index: number) {
  const currentId = form.skus[index]?.specId;
  const used = new Set(
    form.skus
      .filter((_, i) => i !== index)
      .map((row) => row.specId)
      .filter((id): id is number => id != null)
  );
  return specs.value.filter((spec) => spec.id === currentId || !used.has(spec.id));
}

function addSkuRow() {
  const next = unusedEnabledSpecs()[0];
  if (!next) {
    ElMessage.warning("没有可添加的启用规格");
    return;
  }
  form.skus.push(emptySkuRow(next.id, 0));
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchProductList({
      name: query.name.trim() || undefined,
      categoryId: query.categoryId,
      festivalId: query.festivalId,
      status: query.status,
    });
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.name = "";
  query.categoryId = undefined;
  query.festivalId = undefined;
  query.status = undefined;
  load();
}

function resetForm() {
  form.id = 0;
  form.name = "";
  form.subtitle = "";
  form.coverUrl = "";
  form.galleryUrls = [];
  form.detailHtml = "";
  form.detailImageUrls = [];
  form.status = 1;
  form.categoryId = undefined;
  form.festivalIds = [];
  form.stock = 0;
  const defaultSpec = specs.value.find((s) => s.status === 1 && s.name === "件")
    || specs.value.find((s) => s.status === 1);
  form.skus = [emptySkuRow(defaultSpec?.id, 1)];
}

function openDetail(row: ProductVO) {
  detailId.value = row.id;
  detailVisible.value = true;
}

async function openCreate() {
  await loadTrees();
  resetForm();
  visible.value = true;
}

async function openEdit(row: ProductVO) {
  await loadTrees();
  form.id = row.id;
  form.name = row.name;
  form.subtitle = row.subtitle || "";
  form.coverUrl = row.coverUrl || "";
  form.galleryUrls = row.galleryUrls?.length
    ? [...row.galleryUrls]
    : row.coverUrl
      ? [row.coverUrl]
      : [];
  form.detailHtml = row.detailHtml || "";
  form.detailImageUrls = [...(row.detailImageUrls || [])];
  form.status = row.status;
  form.categoryId = row.categoryId;
  form.festivalIds = [...(row.festivalIds || [])];
  form.stock = row.stock ?? 0;
  form.skus = (row.skus || []).map((sku) => ({
    specId: sku.specId,
    price: Number(sku.price),
    originPrice: sku.originPrice != null ? Number(sku.originPrice) : undefined,
    status: sku.status ?? 1,
    isBase: sku.isBase === 1 ? 1 : 0,
    convertQty: sku.convertQty && sku.convertQty > 0 ? sku.convertQty : sku.isBase === 1 ? 1 : 12,
    freightQty: sku.freightQty && sku.freightQty > 0 ? sku.freightQty : 1,
  }));
  if (!form.skus.length) {
    form.skus = [emptySkuRow(undefined, 1)];
  } else if (!form.skus.some((s) => s.status === 1 && s.isBase === 1)) {
    const firstEnabled = form.skus.findIndex((s) => s.status === 1);
    setBase(firstEnabled >= 0 ? firstEnabled : 0);
  }
  visible.value = true;
}

function moveUrl(list: string[], index: number, delta: number) {
  const next = index + delta;
  if (next < 0 || next >= list.length) {
    return;
  }
  const current = list[index];
  list[index] = list[next];
  list[next] = current;
}

async function onUpload(options: UploadRequestOptions, list: string[], max: number) {
  if (list.length >= max) {
    ElMessage.warning(`最多上传 ${max} 张`);
    return;
  }
  const { data } = await uploadAdminFile(options.file as File, "product");
  list.push(data.data.url);
  ElMessage.success("上传成功");
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  if (!form.categoryId) {
    ElMessage.warning("请选择商品分类");
    return;
  }
  const skus = form.skus.filter((row) => row.specId != null);
  if (!skus.length) {
    ElMessage.warning("请至少添加一个售卖规格");
    return;
  }
  if (skus.some((row) => !row.price || row.price <= 0)) {
    ElMessage.warning("每个规格都需要填写大于 0 的现价");
    return;
  }
  const specIds = skus.map((row) => row.specId);
  if (new Set(specIds).size !== specIds.length) {
    ElMessage.warning("同一商品不能重复选择同一规格");
    return;
  }
  if (!skus.some((row) => row.status === 1)) {
    ElMessage.warning("请至少启用一个售卖规格");
    return;
  }
  const enabled = skus.filter((row) => row.status === 1);
  if (enabled.filter((row) => row.isBase === 1).length !== 1) {
    ElMessage.warning("启用规格中必须指定且仅指定一个库存单位");
    return;
  }
  if (enabled.some((row) => row.isBase !== 1 && (!row.convertQty || row.convertQty < 2))) {
    ElMessage.warning("非库存单位换算必须为大于等于 2 的整数");
    return;
  }
  if (form.stock == null || form.stock < 0) {
    ElMessage.warning("库存不能为负数");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      subtitle: form.subtitle,
      coverUrl: form.galleryUrls[0] || "",
      galleryUrls: form.galleryUrls,
      detailHtml: form.detailHtml,
      detailImageUrls: form.detailImageUrls,
      status: form.status,
      categoryId: form.categoryId,
      festivalIds: form.festivalIds,
      stock: form.stock,
      skus: skus.map((row, index) => ({
        specId: row.specId as number,
        price: row.price,
        originPrice: row.originPrice,
        status: row.status,
        sort: (skus.length - index) * 10,
        isBase: row.isBase === 1 ? 1 : 0,
        convertQty: row.isBase === 1 ? 1 : row.convertQty,
        freightQty: row.freightQty && row.freightQty > 0 ? row.freightQty : 1,
      })),
    };
    if (form.id) {
      await updateProduct(form.id, payload);
    } else {
      await createProduct(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: ProductVO) {
  const next = row.status === 1 ? 0 : 1;
  await updateProductStatus(row.id, next);
  ElMessage.success(next === 1 ? "已上架" : "已下架");
  await load();
}

onMounted(async () => {
  await Promise.all([load(), loadTrees()]);
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
.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.img-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}
.img-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.img-actions {
  display: flex;
  gap: 4px;
}
.tip {
  margin-top: 6px;
  color: #9ca3af;
  font-size: 12px;
}
.muted {
  color: #9ca3af;
}
.price-preview {
  font-weight: 700;
  color: #111827;
}
.origin-preview {
  margin-left: 12px;
  color: #9ca3af;
  text-decoration: line-through;
  font-size: 13px;
}
.sku-block {
  width: 100%;
}
.add-sku {
  margin-top: 8px;
}
</style>
