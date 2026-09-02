<template>
  <div>
    <div class="toolbar">
      <el-input v-model="query.phone" placeholder="手机号" clearable style="width: 180px" @keyup.enter="search" />
      <el-select v-model="query.reasonCode" clearable placeholder="拉黑原因" style="width: 200px">
        <el-option v-for="item in reasons" :key="item.code" :label="item.label" :value="item.code" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button v-if="userStore.hasPermission('blacklist:create')" type="primary" @click="openCreate">
        加入黑名单
      </el-button>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" border stripe>
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="reasonLabel" label="拉黑原因" min-width="160" />
      <el-table-column label="已注册用户" min-width="140">
        <template #default="{ row }">{{ row.memberNo || "-" }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="拉黑时间" min-width="170" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="userStore.hasPermission('blacklist:delete')"
            link
            type="danger"
            @click="onDelete(row)"
          >
            移出
          </el-button>
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

    <el-dialog v-model="visible" title="加入黑名单" width="440px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="11位手机号" />
        </el-form-item>
        <el-form-item label="拉黑原因" prop="reasonCode">
          <el-select v-model="form.reasonCode" placeholder="请选择一项" style="width: 100%">
            <el-option v-for="item in reasons" :key="item.code" :label="item.label" :value="item.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  createBlacklistPhone,
  deleteBlacklistPhone,
  fetchBlacklistPhones,
  fetchBlacklistReasons,
  type AdminMemberBlacklistVO,
  type MemberBlacklistReasonVO,
} from "@/api/blacklist";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const rows = ref<AdminMemberBlacklistVO[]>([]);
const reasons = ref<MemberBlacklistReasonVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const query = reactive({ phone: "", reasonCode: "" });
const visible = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({ phone: "", reasonCode: "" });

const rules: FormRules = {
  phone: [
    { required: true, message: "请填写手机号", trigger: "blur" },
    { pattern: /^1\d{10}$/, message: "请填写11位手机号", trigger: "blur" },
  ],
  reasonCode: [{ required: true, message: "请选择拉黑原因", trigger: "change" }],
};

async function loadReasons() {
  const { data } = await fetchBlacklistReasons();
  reasons.value = data.data || [];
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchBlacklistPhones({
      phone: query.phone || undefined,
      reasonCode: query.reasonCode || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    rows.value = data.data?.records || [];
    total.value = data.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNum.value = 1;
  load();
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function resetForm() {
  form.phone = "";
  form.reasonCode = "";
  formRef.value?.clearValidate();
}

async function onSave() {
  await formRef.value?.validate();
  saving.value = true;
  try {
    await createBlacklistPhone({ phone: form.phone.trim(), reasonCode: form.reasonCode });
    ElMessage.success("已加入黑名单");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function onDelete(row: AdminMemberBlacklistVO) {
  await ElMessageBox.confirm(`确定将 ${row.phone} 移出黑名单？`, "提示", { type: "warning" });
  await deleteBlacklistPhone(row.id);
  ElMessage.success("已移出");
  await load();
}

onMounted(async () => {
  await loadReasons();
  await load();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
