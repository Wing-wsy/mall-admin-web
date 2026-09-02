<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增兑换商品</el-button>
      <el-button @click="load">刷新</el-button>
      <span class="hint">积分兑换只能按库存单位兑换，配置的积分为兑换 1 个库存单位所需分数</span>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column label="商品" min-width="180">
        <template #default="{ row }">
          <div class="prod">
            <el-image
              v-if="row.coverUrl"
              :src="row.coverUrl"
              style="width: 48px; height: 48px"
              fit="cover"
            />
            <el-button v-if="row.productId" link type="primary" @click="openDetail(row.productId)">
              {{ row.productName || "-" }}
            </el-button>
            <span v-else>{{ row.productName || "-" }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="baseSpecName" label="库存单位" width="110">
        <template #default="{ row }">{{ row.baseSpecName || "-" }}</template>
      </el-table-column>
      <el-table-column label="兑换积分" width="140">
        <template #default="{ row }">
          {{ row.points }} 积分 / 1{{ row.baseSpecName || "库存单位" }}
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
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.productId)">详情</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? "停用" : "启用" }}</el-button>
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

    <el-dialog v-model="visible" :title="form.id ? '编辑兑换商品' : '新增兑换商品'" width="520px">
      <el-alert
        class="form-alert"
        type="info"
        :closable="false"
        title="积分兑换只能按库存单位兑换，C 端无法选择包、箱等换算规格"
      />
      <el-form label-width="96px">
        <el-form-item label="商品" required>
          <el-select v-model="form.productId" filterable placeholder="选择商品" style="width: 100%">
            <el-option
              v-for="p in products"
              :key="p.id"
              :label="`${p.name} (#${p.id})`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="库存单位">
          <span>{{ selectedBaseSpec || "-" }}</span>
        </el-form-item>
        <el-form-item label="兑换积分" required>
          <el-input-number v-model="form.points" :min="1" :precision="0" />
          <span class="tip">兑换 1{{ selectedBaseSpec || "库存单位" }} 所需积分</span>
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

    <ProductDetailDialog v-model="detailVisible" :product-id="detailProductId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ProductDetailDialog from "@/components/ProductDetailDialog.vue";
import {
  createPointProduct,
  fetchPointProductList,
  updatePointProduct,
  updatePointProductStatus,
  type AdminPointProductVO,
} from "@/api/point";
import { fetchProductList, type ProductVO } from "@/api/product";

const list = ref<AdminPointProductVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const products = ref<ProductVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const detailVisible = ref(false);
const detailProductId = ref<number | undefined>(undefined);

const form = reactive({
  id: 0,
  productId: undefined as number | undefined,
  points: 100,
  sort: 0,
  status: 1,
});

const selectedBaseSpec = computed(() => baseSpecOf(form.productId));

function baseSpecOf(productId?: number) {
  if (!productId) {
    return "";
  }
  const product = products.value.find((p) => p.id === productId);
  const sku = product?.skus?.find((s) => s.isBase === 1);
  return sku?.specName || "";
}

async function loadProducts() {
  const { data } = await fetchProductList({ pageSize: 500 });
  products.value = data.data?.records || [];
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchPointProductList({
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
  form.productId = products.value[0]?.id;
  form.points = 100;
  form.sort = 0;
  form.status = 1;
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function openEdit(row: AdminPointProductVO) {
  form.id = row.id;
  form.productId = row.productId;
  form.points = row.points;
  form.sort = row.sort ?? 0;
  form.status = row.status;
  visible.value = true;
}

function openDetail(productId?: number) {
  if (!productId) {
    return;
  }
  detailProductId.value = productId;
  detailVisible.value = true;
}

async function save() {
  if (!form.productId) {
    ElMessage.warning("请选择商品");
    return;
  }
  if (!form.points || form.points < 1) {
    ElMessage.warning("兑换积分必须大于0");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      productId: form.productId,
      points: form.points,
      sort: form.sort,
      status: form.status,
    };
    if (form.id) {
      await updatePointProduct(form.id, payload);
    } else {
      await createPointProduct(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: AdminPointProductVO) {
  const next = row.status === 1 ? 0 : 1;
  await updatePointProductStatus(row.id, next);
  ElMessage.success(next === 1 ? "已启用" : "已停用");
  await load();
}

onMounted(async () => {
  await loadProducts();
  await load();
});
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hint {
  color: #9ca3af;
  font-size: 12px;
}
.form-alert {
  margin-bottom: 16px;
}
.prod {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tip {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
