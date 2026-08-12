<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增轮播</el-button>
      <el-button @click="load">刷新</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="图片" width="120">
        <template #default="{ row }">
          <el-image
            v-if="row.imageUrl"
            :src="row.imageUrl"
            style="width: 96px; height: 48px"
            fit="cover"
          />
          <span v-else class="muted">未上传</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="140" />
      <el-table-column prop="productName" label="关联商品" min-width="140" />
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

    <el-dialog v-model="visible" :title="form.id ? '编辑轮播' : '新增轮播'" width="560px">
      <el-form label-width="96px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="轮播图" required>
          <div class="upload-row">
            <el-upload :show-file-list="false" :http-request="onUpload" accept="image/*">
              <el-button>上传图片</el-button>
            </el-upload>
            <el-image
              v-if="form.imageUrl"
              :src="form.imageUrl"
              style="width: 160px; height: 80px"
              fit="cover"
            />
          </div>
        </el-form-item>
        <el-form-item label="关联商品" required>
          <el-select v-model="form.productId" filterable placeholder="选择商品" style="width: 100%">
            <el-option
              v-for="p in products"
              :key="p.id"
              :label="`${p.name} (#${p.id})`"
              :value="p.id"
            />
          </el-select>
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
import type { UploadRequestOptions } from "element-plus";
import {
  createBanner,
  deleteBanner,
  fetchBannerList,
  updateBanner,
  type BannerVO,
} from "@/api/banner";
import { fetchProductList, uploadAdminFile, type ProductVO } from "@/api/product";

const list = ref<BannerVO[]>([]);
const products = ref<ProductVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

const form = reactive({
  id: 0,
  title: "",
  imageUrl: "",
  productId: undefined as number | undefined,
  sort: 0,
  status: 1,
});

async function load() {
  loading.value = true;
  try {
    const [bannerRes, productRes] = await Promise.all([fetchBannerList(), fetchProductList()]);
    list.value = bannerRes.data.data || [];
    products.value = productRes.data.data || [];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = 0;
  form.title = "";
  form.imageUrl = "";
  form.productId = products.value[0]?.id;
  form.sort = 0;
  form.status = 1;
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function openEdit(row: BannerVO) {
  form.id = row.id;
  form.title = row.title || "";
  form.imageUrl = row.imageUrl || "";
  form.productId = row.productId;
  form.sort = row.sort ?? 0;
  form.status = row.status;
  visible.value = true;
}

async function onUpload(options: UploadRequestOptions) {
  const { data } = await uploadAdminFile(options.file as File, "banner");
  form.imageUrl = data.data.url;
  ElMessage.success("上传成功");
}

async function save() {
  if (!form.imageUrl) {
    ElMessage.warning("请上传轮播图");
    return;
  }
  if (!form.productId) {
    ElMessage.warning("请选择关联商品");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: form.title,
      imageUrl: form.imageUrl,
      productId: form.productId,
      sort: form.sort,
      status: form.status,
    };
    if (form.id) {
      await updateBanner(form.id, payload);
    } else {
      await createBanner(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function onDelete(row: BannerVO) {
  await ElMessageBox.confirm(`确认删除轮播「${row.title || row.id}」？`, "提示");
  await deleteBanner(row.id);
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
.muted {
  color: #9ca3af;
}
</style>
