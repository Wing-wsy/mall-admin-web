<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增销售属性</el-button>
      <el-button @click="load">刷新</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="属性名" min-width="120" />
      <el-table-column label="属性值" min-width="220">
        <template #default="{ row }">
          <span v-if="row.values?.length">{{ formatValues(row) }}</span>
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? "启用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">
            {{ row.status === 1 ? "停用" : "启用" }}
          </el-button>
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

    <el-dialog v-model="visible" :title="form.id ? '编辑销售属性' : '新增销售属性'" width="560px">
      <el-form label-width="88px">
        <el-form-item label="属性名" required>
          <el-input v-model="form.name" maxlength="32" show-word-limit placeholder="如 颜色、容量" />
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
        <el-form-item label="属性值" required>
          <div class="values-block">
            <el-table :data="form.values" border size="small">
              <el-table-column label="值名称" min-width="160">
                <template #default="{ row }">
                  <el-input v-model="row.valueName" maxlength="64" placeholder="如 红色" />
                </template>
              </el-table-column>
              <el-table-column label="排序" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.sort" :min="0" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column label="" width="72">
                <template #default="{ $index }">
                  <el-button link type="danger" @click="form.values.splice($index, 1)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="add-value" @click="addValue">添加属性值</el-button>
          </div>
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
  createSaleAttr,
  deleteSaleAttr,
  fetchSaleAttrList,
  updateSaleAttr,
  updateSaleAttrStatus,
  type SaleAttrVO,
  type SaleAttrValueVO,
} from "@/api/saleAttr";

const list = ref<SaleAttrVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

const form = reactive({
  id: 0,
  name: "",
  sort: 0,
  status: 1,
  values: [] as SaleAttrValueVO[],
});

function formatValues(row: SaleAttrVO) {
  return (row.values || []).map((v) => v.valueName).join("、");
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchSaleAttrList({
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

function emptyValue(): SaleAttrValueVO {
  return { valueName: "", sort: 0, status: 1 };
}

function resetForm() {
  form.id = 0;
  form.name = "";
  form.sort = 0;
  form.status = 1;
  form.values = [emptyValue()];
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function openEdit(row: SaleAttrVO) {
  form.id = row.id;
  form.name = row.name;
  form.sort = row.sort ?? 0;
  form.status = row.status;
  form.values = (row.values || []).map((v) => ({
    id: v.id,
    valueName: v.valueName,
    sort: v.sort ?? 0,
    status: v.status ?? 1,
  }));
  if (!form.values.length) {
    form.values = [emptyValue()];
  }
  visible.value = true;
}

function addValue() {
  form.values.push(emptyValue());
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写属性名");
    return;
  }
  const values = form.values
    .map((v) => ({
      id: v.id,
      valueName: (v.valueName || "").trim(),
      sort: v.sort ?? 0,
      status: v.status ?? 1,
    }))
    .filter((v) => v.valueName);
  if (!values.length) {
    ElMessage.warning("请至少填写一个属性值");
    return;
  }
  const names = values.map((v) => v.valueName);
  if (new Set(names).size !== names.length) {
    ElMessage.warning("属性值名称不能重复");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      sort: form.sort,
      status: form.status,
      values,
    };
    if (form.id) {
      await updateSaleAttr(form.id, payload);
    } else {
      await createSaleAttr(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: SaleAttrVO) {
  const next = row.status === 1 ? 0 : 1;
  await updateSaleAttrStatus(row.id, next);
  ElMessage.success(next === 1 ? "已启用" : "已停用");
  await load();
}

async function onDelete(row: SaleAttrVO) {
  await ElMessageBox.confirm(`确认删除销售属性「${row.name}」？已被商品使用的属性无法删除。`, "提示");
  await deleteSaleAttr(row.id);
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
.tip {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.muted {
  color: #9ca3af;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.values-block {
  width: 100%;
}
.add-value {
  margin-top: 8px;
}
</style>
