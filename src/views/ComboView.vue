<template>
  <div>
    <div class="toolbar">
      <el-input v-model="query.name" clearable placeholder="套装名称" style="width: 180px" @keyup.enter="search" />
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 120px">
        <el-option label="上架" :value="1" />
        <el-option label="下架" :value="0" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button type="primary" @click="openCreate">新建套装</el-button>
      <el-button @click="load">刷新</el-button>
      <span class="hint">仅自营商品可组套；下单按礼盒发货，库存扣子商品</span>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="封面" width="90">
        <template #default="{ row }">
          <el-image v-if="row.coverUrl" :src="row.coverUrl" style="width: 56px; height: 56px" fit="cover" />
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="套装" min-width="160" />
      <el-table-column prop="price" label="售价" width="90" />
      <el-table-column prop="itemCount" label="组成数" width="80" />
      <el-table-column prop="sort" label="排序" width="70" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? "上架" : "下架" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="toggleStatus(row)">
            {{ row.status === 1 ? "下架" : "上架" }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="load"
        @size-change="search"
      />
    </div>

    <el-dialog v-model="visible" :title="form.id ? '编辑套装' : '新建套装'" width="760px" top="4vh" destroy-on-close>
      <el-form label-width="96px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="128" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" maxlength="255" />
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
          <div class="tip">建议 1:1，最多 9 张；第一张作为列表封面</div>
        </el-form-item>
        <el-form-item label="售价" required>
          <el-input-number v-model="form.price" :min="0.01" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="划线价">
          <el-input-number v-model="form.originPrice" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="运费件数">
          <el-input-number v-model="form.freightQty" :min="1" />
          <span class="tip">每个礼盒按多少件计运费</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="详情文案">
          <el-input v-model="form.detailHtml" type="textarea" :rows="3" placeholder="可选，支持纯文本" />
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
        <el-form-item label="组成商品" required>
          <div class="items-block">
            <div v-for="(item, idx) in form.items" :key="idx" class="item-row">
              <el-cascader
                v-model="item.productId"
                :options="productPickTree"
                :props="productPickCascaderProps"
                filterable
                clearable
                placeholder="按分类选择自营商品"
                style="width: 280px"
                @change="onProductChange(item)"
              />
              <el-select v-model="item.skuId" placeholder="规格" style="width: 140px">
                <el-option
                  v-for="s in skusOf(item.productId)"
                  :key="s.id"
                  :label="s.specName || '规格'"
                  :value="s.id!"
                />
              </el-select>
              <el-input-number v-model="item.quantity" :min="1" />
              <el-button link type="danger" @click="form.items.splice(idx, 1)">删除</el-button>
            </div>
            <el-button @click="addItem">添加组成</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <ComboDetailDialog v-model="detailVisible" :combo-id="detailComboId" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import ComboDetailDialog from "@/components/ComboDetailDialog.vue";
import {
  createCombo,
  fetchComboDetail,
  fetchComboList,
  updateCombo,
  updateComboStatus,
  type ComboItemPayload,
  type ComboVO,
} from "@/api/combo";
import { fetchProductList, uploadAdminFile, type ProductVO } from "@/api/product";
import { CATEGORY_TYPE_PRODUCT, fetchCategoryTree } from "@/api/category";
import {
  buildProductPickTree,
  productPickCascaderProps,
  type ProductPickTreeOption,
} from "@/utils/productPickTree";

const list = ref<ComboVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const detailVisible = ref(false);
const detailComboId = ref<number>();
const selfProducts = ref<ProductVO[]>([]);
const productPickTree = ref<ProductPickTreeOption[]>([]);

const query = reactive({
  name: "",
  status: undefined as number | undefined,
});

const form = reactive({
  id: 0,
  name: "",
  subtitle: "",
  galleryUrls: [] as string[],
  detailImageUrls: [] as string[],
  price: 1,
  originPrice: undefined as number | undefined,
  detailHtml: "",
  freightQty: 1,
  sort: 0,
  status: 0,
  items: [] as ComboItemPayload[],
});

async function loadSelfProducts() {
  const [productRes, treeRes] = await Promise.all([
    fetchProductList({ pageSize: 500, status: 1, supplierId: 0 }),
    fetchCategoryTree(CATEGORY_TYPE_PRODUCT),
  ]);
  const products = (productRes.data.data?.records || []).filter(
    (p) => p.selfOperated !== false && !p.supplierId,
  );
  selfProducts.value = products;
  productPickTree.value = buildProductPickTree(treeRes.data.data || [], products);
}

function skusOf(productId?: number) {
  if (!productId) return [];
  return selfProducts.value.find((p) => p.id === productId)?.skus?.filter((s) => s.status === 1) || [];
}

function onProductChange(item: ComboItemPayload) {
  const skus = skusOf(item.productId);
  item.skuId = skus[0]?.id || (undefined as unknown as number);
}

function addItem() {
  form.items.push({ productId: undefined as unknown as number, skuId: undefined as unknown as number, quantity: 1 });
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchComboList({
      name: query.name || undefined,
      status: query.status,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    list.value = data.data?.records || [];
    total.value = data.data?.total || 0;
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
  form.name = "";
  form.subtitle = "";
  form.galleryUrls = [];
  form.detailImageUrls = [];
  form.price = 1;
  form.originPrice = undefined;
  form.detailHtml = "";
  form.freightQty = 1;
  form.sort = 0;
  form.status = 0;
  form.items = [];
}

async function openCreate() {
  resetForm();
  addItem();
  await loadSelfProducts();
  visible.value = true;
}

function openDetail(row: ComboVO) {
  detailComboId.value = row.id;
  detailVisible.value = true;
}

async function openEdit(row: ComboVO) {
  resetForm();
  await loadSelfProducts();
  const { data } = await fetchComboDetail(row.id);
  const d = data.data;
  if (!d) return;
  form.id = d.id;
  form.name = d.name;
  form.subtitle = d.subtitle || "";
  form.galleryUrls = d.galleryUrls?.length
    ? [...d.galleryUrls]
    : d.coverUrl
      ? [d.coverUrl]
      : [];
  form.detailImageUrls = [...(d.detailImageUrls || [])];
  form.price = Number(d.price);
  form.originPrice = d.originPrice == null ? undefined : Number(d.originPrice);
  form.detailHtml = d.detailHtml || "";
  form.freightQty = d.freightQty || 1;
  form.sort = d.sort || 0;
  form.status = d.status;
  form.items = (d.items || []).map((i) => ({
    productId: i.productId,
    skuId: i.skuId,
    quantity: i.quantity,
    sort: i.sort,
  }));
  if (!form.items.length) addItem();
  visible.value = true;
}

function moveUrl(list: string[], index: number, delta: number) {
  const next = index + delta;
  if (next < 0 || next >= list.length) return;
  const tmp = list[index];
  list[index] = list[next];
  list[next] = tmp;
}

async function onUpload(options: UploadRequestOptions, list: string[], max: number) {
  if (list.length >= max) {
    ElMessage.warning(`最多上传 ${max} 张`);
    return;
  }
  const { data } = await uploadAdminFile(options.file as File, "combo");
  const url = data.data?.url || "";
  if (url) list.push(url);
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写套装名称");
    return;
  }
  if (!form.items.length || form.items.some((i) => !i.productId || !i.skuId || !i.quantity)) {
    ElMessage.warning("请完整配置组成商品");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      subtitle: form.subtitle || undefined,
      coverUrl: form.galleryUrls[0] || undefined,
      galleryUrls: form.galleryUrls,
      detailImageUrls: form.detailImageUrls,
      price: form.price,
      originPrice: form.originPrice,
      detailHtml: form.detailHtml || undefined,
      freightQty: form.freightQty,
      sort: form.sort,
      status: form.status,
      items: form.items.map((i, idx) => ({
        productId: i.productId,
        skuId: i.skuId,
        quantity: i.quantity,
        sort: (form.items.length - idx) * 10,
      })),
    };
    if (form.id) {
      await updateCombo(form.id, payload);
    } else {
      await createCombo(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: ComboVO) {
  const next = row.status === 1 ? 0 : 1;
  await ElMessageBox.confirm(next === 1 ? "确认上架该套装？" : "确认下架该套装？", "提示");
  await updateComboStatus(row.id, next);
  ElMessage.success("已更新");
  load();
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.hint,
.tip,
.muted {
  color: #909399;
  font-size: 13px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.items-block {
  width: 100%;
}
.item-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
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
</style>
