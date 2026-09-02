<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建账号</el-button>
      <el-button @click="load">刷新</el-button>
      <el-input
        v-model="query.username"
        clearable
        placeholder="用户名（模糊）"
        style="width: 160px"
        @keyup.enter="search"
      />
      <el-input
        v-model="query.nickname"
        clearable
        placeholder="昵称（模糊）"
        style="width: 160px"
        @keyup.enter="search"
      />
      <el-select v-model="query.roleId" clearable filterable placeholder="角色" style="width: 160px">
        <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
      </el-select>
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 110px">
        <el-option label="正常" :value="1" />
        <el-option label="停用" :value="0" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="nickname" label="昵称" width="140" />
      <el-table-column label="角色" min-width="160">
        <template #default="{ row }">{{ (row.roleNames || []).join("、") }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? "正常" : "停用" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? "停用" : "启用" }}</el-button>
          <el-button link @click="onResetPwd(row)">重置密码</el-button>
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

    <el-dialog v-model="visible" :title="form.id ? '编辑账号' : '新建账号'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="密码" required>
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.roleIds" multiple filterable style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
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
  createAdminUser,
  fetchAdminUserList,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus,
  type AdminUserVO,
} from "@/api/adminUser";
import { fetchRoleList, type RoleVO } from "@/api/role";

const list = ref<AdminUserVO[]>([]);
const roles = ref<RoleVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

const query = reactive({
  username: "",
  nickname: "",
  roleId: undefined as number | undefined,
  status: undefined as number | undefined,
});

const form = reactive({
  id: 0,
  username: "",
  password: "",
  nickname: "",
  roleIds: [] as number[],
});

async function loadRoles() {
  const { data } = await fetchRoleList({ pageSize: 500 });
  roles.value = data.data?.records || [];
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchAdminUserList({
      username: query.username.trim() || undefined,
      nickname: query.nickname.trim() || undefined,
      roleId: query.roleId,
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

function resetQuery() {
  query.username = "";
  query.nickname = "";
  query.roleId = undefined;
  query.status = undefined;
  search();
}

function openCreate() {
  Object.assign(form, { id: 0, username: "", password: "admin123", nickname: "", roleIds: [] });
  visible.value = true;
}

function openEdit(row: AdminUserVO) {
  Object.assign(form, {
    id: row.id,
    username: row.username,
    password: "",
    nickname: row.nickname || "",
    roleIds: [...(row.roleIds || [])],
  });
  visible.value = true;
}

async function save() {
  if (!form.username.trim() || !form.roleIds.length) {
    ElMessage.warning("请填写用户名并选择角色");
    return;
  }
  saving.value = true;
  try {
    if (form.id) {
      await updateAdminUser(form.id, {
        username: form.username,
        nickname: form.nickname,
        roleIds: form.roleIds,
      });
    } else {
      await createAdminUser({
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        roleIds: form.roleIds,
      });
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: AdminUserVO) {
  await updateAdminUserStatus(row.id, row.status === 1 ? 0 : 1);
  ElMessage.success("已更新");
  await load();
}

async function onResetPwd(row: AdminUserVO) {
  const { value } = await ElMessageBox.prompt(`重置「${row.username}」密码`, "重置密码", {
    inputValue: "admin123",
    inputPattern: /.{6,}/,
    inputErrorMessage: "至少6位",
  });
  await resetAdminUserPassword(row.id, value);
  ElMessage.success("密码已重置");
}

onMounted(async () => {
  await loadRoles();
  await load();
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
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
