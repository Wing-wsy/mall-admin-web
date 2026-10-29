<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <span>个人中心</span>
      </template>
      <div class="profile">
        <div class="avatar-block">
          <el-avatar :size="88" :src="userStore.avatarUrl || undefined">
            {{ avatarLetter }}
          </el-avatar>
          <el-upload :show-file-list="false" :http-request="onAvatarUpload" accept="image/*">
            <el-button type="primary" link>更换头像</el-button>
          </el-upload>
        </div>
        <el-form label-width="88px" class="form" @submit.prevent>
          <el-form-item label="用户名">
            <el-input :model-value="userStore.username" disabled />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="nickname" maxlength="64" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="所属租户">
            <el-input :model-value="userStore.tenantName || '-'" disabled />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="onSaveProfile">保存资料</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card shadow="never" class="card">
      <template #header>
        <span>修改密码</span>
      </template>
      <el-form label-width="88px" class="form form-narrow" @submit.prevent>
        <el-form-item label="原密码">
          <el-input v-model="pwd.oldPassword" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwd.newPassword" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="pwd.confirm" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="pwdSaving" @click="onChangePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import { changeAdminPassword, updateAdminProfile } from "@/api/auth";
import { uploadAdminFile } from "@/api/product";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const nickname = ref(userStore.nickname || "");
const saving = ref(false);
const pwdSaving = ref(false);
const pwd = reactive({
  oldPassword: "",
  newPassword: "",
  confirm: "",
});

const avatarLetter = computed(() =>
  (userStore.nickname || userStore.username || "?").slice(0, 1)
);

watch(
  () => userStore.nickname,
  (v) => {
    nickname.value = v || "";
  }
);

async function onSaveProfile() {
  saving.value = true;
  try {
    const { data } = await updateAdminProfile({ nickname: nickname.value.trim() });
    if (data?.data) userStore.login(data.data);
    ElMessage.success("资料已保存");
  } catch {
    // interceptor
  } finally {
    saving.value = false;
  }
}

async function onAvatarUpload(options: UploadRequestOptions) {
  try {
    const { data: upload } = await uploadAdminFile(options.file as File, "avatar");
    const url = upload?.data?.url;
    if (!url) {
      ElMessage.error("上传失败");
      return;
    }
    const { data } = await updateAdminProfile({ avatarUrl: url });
    if (data?.data) userStore.login(data.data);
    ElMessage.success("头像已更新");
  } catch {
    // interceptor
  }
}

async function onChangePassword() {
  if (!pwd.oldPassword || !pwd.newPassword) {
    ElMessage.warning("请填写原密码和新密码");
    return;
  }
  if (pwd.newPassword.length < 6) {
    ElMessage.warning("新密码至少 6 位");
    return;
  }
  if (pwd.newPassword !== pwd.confirm) {
    ElMessage.warning("两次输入的新密码不一致");
    return;
  }
  pwdSaving.value = true;
  try {
    await changeAdminPassword({
      oldPassword: pwd.oldPassword,
      newPassword: pwd.newPassword,
    });
    pwd.oldPassword = "";
    pwd.newPassword = "";
    pwd.confirm = "";
    ElMessage.success("密码已修改");
  } catch {
    // interceptor
  } finally {
    pwdSaving.value = false;
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--mall-bg-card, #fff);
}
.profile {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}
.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
}
.form {
  flex: 1;
  min-width: 280px;
  max-width: 480px;
}
.form-narrow {
  max-width: 420px;
}
</style>
