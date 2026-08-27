<template>
  <div>
    <div class="toolbar">
      <el-input v-model="query.name" placeholder="供应商名称" clearable style="width: 180px" @keyup.enter="load" />
      <el-input
        v-if="!userStore.isSupplier"
        v-model="query.phone"
        placeholder="会员手机号"
        clearable
        style="width: 160px"
        @keyup.enter="load"
      />
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 120px">
        <el-option :value="0" label="待审批" />
        <el-option :value="1" label="已通过" />
        <el-option :value="2" label="已拒绝" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button v-if="!userStore.isSupplier" type="primary" @click="openCreate">新建</el-button>
      <el-button v-if="!userStore.isSupplier" @click="openSetting">设置</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="name" label="供应商" min-width="140" />
      <el-table-column prop="phone" label="会员手机" width="130" />
      <el-table-column prop="contact" label="联系方式" width="130" />
      <el-table-column prop="email" label="邮箱" min-width="140">
        <template #default="{ row }">{{ row.email || "-" }}</template>
      </el-table-column>
      <el-table-column prop="address" label="地址" min-width="160">
        <template #default="{ row }">{{ row.address || "-" }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'">
            {{ row.statusText }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" min-width="170" />
      <el-table-column v-if="!userStore.isSupplier" label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">修改</el-button>
          <el-button v-if="row.status === 0" link type="success" @click="onApprove(row)">通过</el-button>
          <el-button v-if="row.status === 0" link type="danger" @click="onReject(row)">拒绝</el-button>
          <el-button v-if="row.status === 1" link @click="onResetPwd(row)">重置密码</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="formVisible" :title="form.id ? '修改供应商' : '新建供应商'" width="520px">
      <el-form label-width="108px">
        <el-form-item v-if="!form.id" label="会员手机" required>
          <el-input v-model="form.phone" maxlength="11" placeholder="已注册小程序的手机号" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item label="联系方式" required>
          <el-input v-model="form.contact" maxlength="32" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" maxlength="64" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="settingVisible" title="供应商设置" width="480px">
      <el-form label-width="148px">
        <el-form-item label="电脑端登录地址">
          <el-input v-model="setting.adminLoginUrl" placeholder="如 https://admin.example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveSetting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  approveSupplier,
  createSupplier,
  deleteSupplier,
  fetchSupplierList,
  fetchSupplierSetting,
  rejectSupplier,
  resetSupplierPassword,
  updateSupplier,
  updateSupplierSetting,
  type AdminSupplierVO,
} from "@/api/supplier";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

const loading = ref(false);
const saving = ref(false);
const list = ref<AdminSupplierVO[]>([]);
const formVisible = ref(false);
const settingVisible = ref(false);
const query = reactive({
  name: "",
  phone: "",
  status: undefined as number | undefined,
});
const form = reactive({
  id: 0,
  phone: "",
  name: "",
  contact: "",
  email: "",
  address: "",
});
const setting = reactive({
  adminLoginUrl: "",
});

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchSupplierList({
      name: query.name || undefined,
      phone: query.phone || undefined,
      status: query.status,
    });
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.id = 0;
  form.phone = "";
  form.name = "";
  form.contact = "";
  form.email = "";
  form.address = "";
  formVisible.value = true;
}

function openEdit(row: AdminSupplierVO) {
  form.id = row.id;
  form.phone = row.phone || "";
  form.name = row.name;
  form.contact = row.contact;
  form.email = row.email || "";
  form.address = row.address || "";
  formVisible.value = true;
}

async function save() {
  if (!form.name.trim() || !form.contact.trim()) {
    ElMessage.warning("请填写名称和联系方式");
    return;
  }
  if (!form.id && !form.phone.trim()) {
    ElMessage.warning("请填写会员手机号");
    return;
  }
  saving.value = true;
  try {
    if (form.id) {
      await updateSupplier(form.id, {
        name: form.name.trim(),
        contact: form.contact.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      });
    } else {
      await createSupplier({
        phone: form.phone.trim(),
        name: form.name.trim(),
        contact: form.contact.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        status: 1,
      });
    }
    ElMessage.success("已保存");
    formVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function onApprove(row: AdminSupplierVO) {
  await ElMessageBox.confirm(`通过「${row.name}」的申请？通过后将开通后台账号。`, "审批", { type: "warning" });
  await approveSupplier(row.id);
  ElMessage.success("已通过");
  await load();
}

async function onReject(row: AdminSupplierVO) {
  const { value } = await ElMessageBox.prompt("可填写拒绝原因", "拒绝申请", {
    confirmButtonText: "拒绝",
    inputPlaceholder: "选填",
  });
  await rejectSupplier(row.id, value);
  ElMessage.success("已拒绝");
  await load();
}

async function onResetPwd(row: AdminSupplierVO) {
  await ElMessageBox.confirm(`重置「${row.name}」对应会员的后台密码？`, "提示", { type: "warning" });
  const { data } = await resetSupplierPassword(row.id);
  ElMessage.success(`新密码：${data.data?.password || ""}`);
}

async function onDelete(row: AdminSupplierVO) {
  await ElMessageBox.confirm(`删除供应商「${row.name}」？将下架其商品。`, "提示", { type: "warning" });
  await deleteSupplier(row.id);
  ElMessage.success("已删除");
  await load();
}

async function openSetting() {
  const { data } = await fetchSupplierSetting();
  setting.adminLoginUrl = data.data?.adminLoginUrl || "";
  settingVisible.value = true;
}

async function saveSetting() {
  saving.value = true;
  try {
    await updateSupplierSetting({
      adminLoginUrl: setting.adminLoginUrl,
    });
    ElMessage.success("已保存");
    settingVisible.value = false;
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>
