<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增热卖</el-button>
      <el-button @click="load">刷新</el-button>
      <span class="hint">首页按排序展示启用且上架的商品；下架商品不会出现在小程序</span>
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
      <el-table-column prop="productName" label="商品" min-width="180" />
      <el-table-column prop="price" label="现价" width="100" />
      <el-table-column label="商品状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.productStatus === 1" type="success">上架</el-tag>
          <el-tag v-else-if="row.productStatus === 0" type="info">下架</el-tag>
          <el-tag v-else type="danger">已删除</el-tag>
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

    <el-dialog v-model="visible" :title="form.id ? '编辑热卖' : '新增热卖'" width="520px">
      <el-form label-width="96px">
        <el-form-item label="关联商品" required>
          <el-cascader
            v-model="form.productId"
            :options="productPickTree"
            :props="productPickCascaderProps"
            filterable
            clearable
            placeholder="按分类选择商品"
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
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createHotProduct,
  deleteHotProduct,
  fetchHotProductList,
  updateHotProduct,
  type HotProductVO,
} from "@/api/hotProduct";
import { CATEGORY_TYPE_PRODUCT, fetchCategoryTree } from "@/api/category";
import { fetchProductList } from "@/api/product";
import {
  buildProductPickTree,
  firstProductId,
  productPickCascaderProps,
  type ProductPickTreeOption,
} from "@/utils/productPickTree";

const list = ref<HotProductVO[]>([]);
const productPickTree = ref<ProductPickTreeOption[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

const form = reactive({
  id: 0,
  productId: undefined as number | undefined,
  sort: 0,
  status: 1,
});

async function load() {
  loading.value = true;
  try {
    const [hotRes, productRes, treeRes] = await Promise.all([
      fetchHotProductList(),
      fetchProductList(),
      fetchCategoryTree(CATEGORY_TYPE_PRODUCT),
    ]);
    list.value = hotRes.data.data || [];
    productPickTree.value = buildProductPickTree(treeRes.data.data || [], productRes.data.data || []);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = 0;
  form.productId = firstProductId(productPickTree.value);
  form.sort = 0;
  form.status = 1;
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function openEdit(row: HotProductVO) {
  form.id = row.id;
  form.productId = row.productId;
  form.sort = row.sort ?? 0;
  form.status = row.status;
  visible.value = true;
}

async function save() {
  if (!form.productId) {
    ElMessage.warning("请选择关联商品");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      productId: form.productId,
      sort: form.sort,
      status: form.status,
    };
    if (form.id) {
      await updateHotProduct(form.id, payload);
    } else {
      await createHotProduct(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function onDelete(row: HotProductVO) {
  await ElMessageBox.confirm(`确认删除热卖「${row.productName || row.id}」？`, "提示");
  await deleteHotProduct(row.id);
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
}
.hint {
  color: #9ca3af;
  font-size: 12px;
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
