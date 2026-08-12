<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建账号</el-button>
      <el-button @click="load">刷新</el-button>
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
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const form = reactive({
  id: 0,
  username: "",
  password: "",
  nickname: "",
  roleIds: [] as number[],
});

async function load() {
  loading.value = true;
  try {
    const [u, r] = await Promise.all([fetchAdminUserList(), fetchRoleList()]);
    list.value = u.data.data || [];
    roles.value = r.data.data || [];
  } finally {
    loading.value = false;
  }
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

onMounted(load);
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
</style>
