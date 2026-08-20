<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane label="等级配置" name="level" />
      <el-tab-pane label="手机号名单" name="phone" />
    </el-tabs>

    <div v-show="tab === 'level'">
      <div class="toolbar">
        <el-button type="primary" @click="openCreate">新增等级</el-button>
        <el-button @click="loadLevels">刷新</el-button>
      </div>
      <el-table :data="levels" v-loading="levelLoading" border stripe>
        <el-table-column label="图标" width="90">
          <template #default="{ row }">
            <el-image v-if="row.iconUrl" :src="row.iconUrl" style="width: 40px; height: 40px" fit="cover" />
            <span v-else class="muted">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column label="折扣" width="100">
          <template #default="{ row }">{{ strip(row.discount) }} 折</template>
        </el-table-column>
        <el-table-column prop="couponStackModeText" label="优惠叠加" min-width="160" />
        <el-table-column prop="phoneCount" label="手机号" width="90" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? "启用" : "停用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? "停用" : "启用" }}</el-button>
            <el-button link type="danger" @click="onDeleteLevel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-show="tab === 'phone'">
      <div class="toolbar">
        <el-input v-model="phoneQuery" placeholder="手机号" clearable style="width: 180px" @keyup.enter="loadPhones" />
        <el-select v-model="phoneLevelId" clearable placeholder="等级" style="width: 160px">
          <el-option v-for="lv in levels" :key="lv.id" :label="lv.name" :value="lv.id" />
        </el-select>
        <el-button type="primary" @click="loadPhones">查询</el-button>
        <el-button type="primary" @click="openPhoneCreate">新增</el-button>
        <el-button @click="openPhoneBatch">批量新增</el-button>
      </div>
      <el-table :data="phones" v-loading="phoneLoading" border stripe>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="levelName" label="等级" min-width="120" />
        <el-table-column label="已注册用户" min-width="140">
          <template #default="{ row }">{{ row.memberNo || "-" }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="添加时间" min-width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPhoneEdit(row)">改等级</el-button>
            <el-button link type="danger" @click="onDeletePhone(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="levelVisible" :title="levelForm.id ? '编辑等级' : '新增等级'" width="520px">
      <el-form label-width="108px">
        <el-form-item label="名称" required>
          <el-input v-model="levelForm.name" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="折扣" required>
          <el-input-number v-model="levelForm.discount" :min="0.1" :max="9.9" :step="0.1" :precision="1" />
          <span class="tip">8 表示 8 折</span>
        </el-form-item>
        <el-form-item label="优惠叠加" required>
          <el-radio-group v-model="levelForm.couponStackMode">
            <el-radio value="STACK">可与优惠券叠加</el-radio>
            <el-radio value="MUTEX">与优惠券二选一</el-radio>
          </el-radio-group>
          <div class="tip block">叠加：先会员折再按折后价用券。二选一：选券则取消会员折，券按原价计算。</div>
        </el-form-item>
        <el-form-item label="图标">
          <div class="upload-row">
            <el-upload :show-file-list="false" :http-request="onUpload" accept="image/*">
              <el-button>上传图标</el-button>
            </el-upload>
            <el-image v-if="levelForm.iconUrl" :src="levelForm.iconUrl" style="width: 48px; height: 48px" fit="cover" />
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="levelForm.sort" :min="0" />
          <span class="tip">越大越靠前</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="levelForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveLevel">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="phoneVisible" :title="phoneForm.id ? '修改等级' : '新增手机号'" width="460px">
      <el-form label-width="88px">
        <el-form-item label="手机号" required>
          <el-input v-model="phoneForm.phone" maxlength="11" :disabled="!!phoneForm.id" />
        </el-form-item>
        <el-form-item label="等级" required>
          <el-select v-model="phoneForm.levelId" style="width: 100%" placeholder="选择等级">
            <el-option v-for="lv in levels" :key="lv.id" :label="`${lv.name}（${strip(lv.discount)}折）`" :value="lv.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="phoneVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePhone">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchVisible" title="批量新增手机号" width="520px">
      <el-form label-width="88px">
        <el-form-item label="等级" required>
          <el-select v-model="batchForm.levelId" style="width: 100%" placeholder="选择等级">
            <el-option v-for="lv in levels" :key="lv.id" :label="lv.name" :value="lv.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="batchForm.phones" type="textarea" :rows="8" placeholder="每行一个，或用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveBatch">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import { uploadAdminFile } from "@/api/product";
import {
  batchCreateMemberLevelPhones,
  createMemberLevel,
  createMemberLevelPhone,
  deleteMemberLevel,
  deleteMemberLevelPhone,
  fetchMemberLevelPhones,
  fetchMemberLevels,
  updateMemberLevel,
  updateMemberLevelPhone,
  updateMemberLevelStatus,
  type AdminMemberLevelPhoneVO,
  type AdminMemberLevelVO,
} from "@/api/level";

const tab = ref("level");
const levels = ref<AdminMemberLevelVO[]>([]);
const phones = ref<AdminMemberLevelPhoneVO[]>([]);
const levelLoading = ref(false);
const phoneLoading = ref(false);
const levelVisible = ref(false);
const phoneVisible = ref(false);
const batchVisible = ref(false);
const saving = ref(false);
const phoneQuery = ref("");
const phoneLevelId = ref<number | undefined>();

const levelForm = reactive({
  id: 0,
  name: "",
  iconUrl: "",
  discount: 8,
  couponStackMode: "STACK" as "STACK" | "MUTEX",
  sort: 0,
  status: 1,
});

const phoneForm = reactive({
  id: 0,
  phone: "",
  levelId: undefined as number | undefined,
});

const batchForm = reactive({
  phones: "",
  levelId: undefined as number | undefined,
});

function strip(value: number | string | undefined) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return n.toString().replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

async function loadLevels() {
  levelLoading.value = true;
  try {
    const { data } = await fetchMemberLevels();
    levels.value = data.data || [];
  } finally {
    levelLoading.value = false;
  }
}

async function loadPhones() {
  phoneLoading.value = true;
  try {
    const { data } = await fetchMemberLevelPhones({
      phone: phoneQuery.value || undefined,
      levelId: phoneLevelId.value,
    });
    phones.value = data.data || [];
  } finally {
    phoneLoading.value = false;
  }
}

function openCreate() {
  levelForm.id = 0;
  levelForm.name = "";
  levelForm.iconUrl = "";
  levelForm.discount = 8;
  levelForm.couponStackMode = "STACK";
  levelForm.sort = 0;
  levelForm.status = 1;
  levelVisible.value = true;
}

function openEdit(row: AdminMemberLevelVO) {
  levelForm.id = row.id;
  levelForm.name = row.name;
  levelForm.iconUrl = row.iconUrl || "";
  levelForm.discount = Number(row.discount);
  levelForm.couponStackMode = row.couponStackMode;
  levelForm.sort = row.sort || 0;
  levelForm.status = row.status;
  levelVisible.value = true;
}

async function onUpload(opt: UploadRequestOptions) {
  const { data } = await uploadAdminFile(opt.file as File, "level");
  levelForm.iconUrl = data.data.url;
}

async function saveLevel() {
  if (!levelForm.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: levelForm.name.trim(),
      iconUrl: levelForm.iconUrl || null,
      discount: levelForm.discount,
      couponStackMode: levelForm.couponStackMode,
      sort: levelForm.sort,
      status: levelForm.status,
    };
    if (levelForm.id) {
      await updateMemberLevel(levelForm.id, payload);
    } else {
      await createMemberLevel(payload);
    }
    ElMessage.success("已保存");
    levelVisible.value = false;
    await loadLevels();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: AdminMemberLevelVO) {
  await updateMemberLevelStatus(row.id, row.status === 1 ? 0 : 1);
  ElMessage.success("已更新");
  await loadLevels();
}

async function onDeleteLevel(row: AdminMemberLevelVO) {
  await ElMessageBox.confirm(`确定删除等级「${row.name}」？`, "提示", { type: "warning" });
  await deleteMemberLevel(row.id);
  ElMessage.success("已删除");
  await loadLevels();
}

function openPhoneCreate() {
  phoneForm.id = 0;
  phoneForm.phone = "";
  phoneForm.levelId = levels.value[0]?.id;
  phoneVisible.value = true;
}

function openPhoneEdit(row: AdminMemberLevelPhoneVO) {
  phoneForm.id = row.id;
  phoneForm.phone = row.phone;
  phoneForm.levelId = row.levelId;
  phoneVisible.value = true;
}

async function savePhone() {
  if (!phoneForm.phone.trim() || !phoneForm.levelId) {
    ElMessage.warning("请填写手机号并选择等级");
    return;
  }
  saving.value = true;
  try {
    const payload = { phone: phoneForm.phone.trim(), levelId: phoneForm.levelId };
    if (phoneForm.id) {
      await updateMemberLevelPhone(phoneForm.id, payload);
    } else {
      await createMemberLevelPhone(payload);
    }
    ElMessage.success("已保存");
    phoneVisible.value = false;
    await loadPhones();
    await loadLevels();
  } finally {
    saving.value = false;
  }
}

function openPhoneBatch() {
  batchForm.phones = "";
  batchForm.levelId = levels.value[0]?.id;
  batchVisible.value = true;
}

async function saveBatch() {
  if (!batchForm.phones.trim() || !batchForm.levelId) {
    ElMessage.warning("请填写手机号并选择等级");
    return;
  }
  saving.value = true;
  try {
    const { data } = await batchCreateMemberLevelPhones({
      phones: batchForm.phones,
      levelId: batchForm.levelId,
    });
    ElMessage.success(`已导入 ${data.data} 个手机号`);
    batchVisible.value = false;
    await loadPhones();
    await loadLevels();
  } finally {
    saving.value = false;
  }
}

async function onDeletePhone(row: AdminMemberLevelPhoneVO) {
  await ElMessageBox.confirm(`确定删除手机号 ${row.phone}？`, "提示", { type: "warning" });
  await deleteMemberLevelPhone(row.id);
  ElMessage.success("已删除");
  await loadPhones();
  await loadLevels();
}

onMounted(() => {
  loadLevels();
  loadPhones();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.tip {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.tip.block {
  margin: 8px 0 0;
  line-height: 1.5;
}
.muted {
  color: #9ca3af;
}
.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
