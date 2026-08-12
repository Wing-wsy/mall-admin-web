<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增商品</el-button>
      <el-button @click="load">刷新</el-button>
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
      <el-table-column prop="price" label="现价" width="100" />
      <el-table-column prop="originPrice" label="原价" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? "上架" : "下架" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">
            {{ row.status === 1 ? "下架" : "上架" }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑商品' : '新增商品'" width="560px">
      <el-form label-width="88px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" />
        </el-form-item>
        <el-form-item label="封面">
          <div class="upload-row">
            <el-upload :show-file-list="false" :http-request="onUpload" accept="image/*">
              <el-button>上传图片</el-button>
            </el-upload>
            <el-image
              v-if="form.coverUrl"
              :src="form.coverUrl"
              style="width: 80px; height: 80px"
              fit="cover"
            />
          </div>
        </el-form-item>
        <el-form-item label="现价" required>
          <el-input-number v-model="form.price" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="form.originPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="详情">
          <el-input v-model="form.detailHtml" type="textarea" :rows="3" />
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import {
  createProduct,
  fetchProductList,
  updateProduct,
  updateProductStatus,
  uploadAdminFile,
  type ProductVO,
} from "@/api/product";

const list = ref<ProductVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

const form = reactive({
  id: 0,
  name: "",
  subtitle: "",
  coverUrl: "",
  price: 1,
  originPrice: undefined as number | undefined,
  detailHtml: "",
  status: 1,
});

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchProductList();
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = 0;
  form.name = "";
  form.subtitle = "";
  form.coverUrl = "";
  form.price = 1;
  form.originPrice = undefined;
  form.detailHtml = "";
  form.status = 1;
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function openEdit(row: ProductVO) {
  form.id = row.id;
  form.name = row.name;
  form.subtitle = row.subtitle || "";
  form.coverUrl = row.coverUrl || "";
  form.price = Number(row.price);
  form.originPrice = row.originPrice != null ? Number(row.originPrice) : undefined;
  form.detailHtml = row.detailHtml || "";
  form.status = row.status;
  visible.value = true;
}

async function onUpload(options: UploadRequestOptions) {
  const { data } = await uploadAdminFile(options.file as File, "product");
  form.coverUrl = data.data.url;
  ElMessage.success("上传成功");
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      subtitle: form.subtitle,
      coverUrl: form.coverUrl,
      price: form.price,
      originPrice: form.originPrice,
      detailHtml: form.detailHtml,
      status: form.status,
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
.muted {
  color: #9ca3af;
}
</style>
