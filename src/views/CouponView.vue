<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane label="券模板" name="tpl" />
      <el-tab-pane label="发放记录" name="log" />
    </el-tabs>

    <div v-show="tab === 'tpl'">
      <div class="toolbar">
        <el-button type="primary" @click="openCreate">新增模板</el-button>
        <el-button @click="openIssue()">发券</el-button>
        <el-button @click="loadTemplates">刷新</el-button>
      </div>
      <el-table :data="templates" v-loading="tplLoading" border stripe>
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="issueTypeText" label="发放方式" width="110" />
        <el-table-column prop="benefitText" label="优惠" width="140" />
        <el-table-column prop="validDays" label="有效天数" width="100" />
        <el-table-column label="领取截止" min-width="170">
          <template #default="{ row }">
            {{ row.issueType === "CLAIM" ? formatTime(row.claimEnd) : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="库存" width="120">
          <template #default="{ row }">
            {{ row.issuedCount || 0 }} / {{ row.totalQuota == null ? "不限" : row.totalQuota }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? "启用" : "停用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? "停用" : "启用" }}</el-button>
            <el-button link type="primary" @click="openIssue(row)">发券</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-show="tab === 'log'">
      <div class="toolbar">
        <el-input v-model="couponNo" placeholder="券编号" clearable style="width: 180px" @keyup.enter="loadRecords" />
        <el-input v-model="recordMemberNo" placeholder="用户ID" clearable style="width: 180px" @keyup.enter="loadRecords" />
        <el-select v-model="recordStatus" clearable placeholder="状态" style="width: 120px">
          <el-option :value="0" label="未使用" />
          <el-option :value="1" label="已占用" />
          <el-option :value="2" label="已使用" />
          <el-option :value="3" label="已过期" />
        </el-select>
        <el-button type="primary" @click="loadRecords">查询</el-button>
      </div>
      <el-table :data="records" v-loading="logLoading" border stripe>
        <el-table-column prop="couponNo" label="券编号" min-width="140" />
        <el-table-column prop="memberNo" label="用户ID" min-width="140">
          <template #default="{ row }">{{ row.memberNo || "-" }}</template>
        </el-table-column>
        <el-table-column prop="name" label="券名称" min-width="140" />
        <el-table-column prop="benefitText" label="优惠" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="recordStatusType(row.status)" size="small">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expireTime" label="过期时间" min-width="170" />
        <el-table-column prop="createTime" label="发放时间" min-width="170" />
      </el-table>
    </div>

    <el-dialog v-model="tplVisible" :title="form.id ? '编辑券模板' : '新增券模板'" width="560px">
      <el-form label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="发放方式" required>
          <el-select v-model="form.issueType" style="width: 100%" :disabled="!!form.id" @change="onIssueTypeChange">
            <el-option value="REGISTER" label="注册自动发放（满减）" />
            <el-option value="FIRST_ORDER" label="首单完成后发放（满减）" />
            <el-option value="CLAIM" label="活动页领取（打折）" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.issueType !== 'CLAIM'" label="满x元" required>
          <el-input-number v-model="form.thresholdAmount" :min="0" :precision="2" :step="1" />
          <span class="tip">0 表示无门槛</span>
        </el-form-item>
        <el-form-item v-if="form.issueType !== 'CLAIM'" label="减y元" required>
          <el-input-number v-model="form.benefitValue" :min="0.01" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item v-else label="打x折" required>
          <el-input-number v-model="form.benefitValue" :min="0.1" :max="9.9" :precision="1" :step="0.1" />
          <span class="tip">8 表示 8 折</span>
        </el-form-item>
        <el-form-item label="有效天数" required>
          <el-input-number v-model="form.validDays" :min="1" :max="365" />
        </el-form-item>
        <el-form-item v-if="form.issueType === 'CLAIM'" label="领取时间">
          <el-date-picker
            v-model="claimRange"
            type="datetimerange"
            start-placeholder="领取开始"
            end-placeholder="领取结束"
            format="YYYY年MM月DD日 HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
          <div class="tip block">当前时间在开始和结束之间，领券中心才会展示。有效天数是用户领到之后能用几天。</div>
        </el-form-item>
        <el-form-item v-if="form.issueType === 'CLAIM'" label="发放上限">
          <el-input-number v-model="form.totalQuota" :min="0" />
          <span class="tip">0 或不填表示不限</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tplVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueVisible" title="给用户发券" width="480px">
      <el-form label-width="88px">
        <el-form-item label="券模板" required>
          <el-select v-model="issueTemplateId" filterable style="width: 100%" placeholder="选择启用中的模板">
            <el-option
              v-for="t in enabledTemplates"
              :key="t.id"
              :label="`${t.name}（${t.benefitText}）`"
              :value="t.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户ID" required>
          <el-input
            v-model="issueMemberNos"
            type="textarea"
            :rows="4"
            placeholder="每行一个用户ID，如 M6BEA86ABE9"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="issueVisible = false">取消</el-button>
        <el-button type="primary" :loading="issuing" @click="submitIssue">发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createCouponTemplate,
  fetchCouponRecords,
  fetchCouponTemplates,
  issueCoupons,
  updateCouponTemplate,
  updateCouponTemplateStatus,
  type AdminCouponTemplateVO,
  type AdminCouponVO,
} from "@/api/coupon";

const tab = ref("tpl");
const templates = ref<AdminCouponTemplateVO[]>([]);
const records = ref<AdminCouponVO[]>([]);
const tplLoading = ref(false);
const logLoading = ref(false);
const tplVisible = ref(false);
const saving = ref(false);
const issueVisible = ref(false);
const issuing = ref(false);
const issueTemplateId = ref<number>();
const issueMemberNos = ref("");
const couponNo = ref("");
const recordMemberNo = ref("");
const recordStatus = ref<number | undefined>();
const claimRange = ref<[string, string] | null>(null);

const form = reactive({
  id: 0,
  name: "",
  issueType: "REGISTER",
  thresholdAmount: 0,
  benefitValue: 5,
  validDays: 7,
  totalQuota: 0,
  status: 1,
});

const enabledTemplates = computed(() => templates.value.filter((t) => t.status === 1));

function recordStatusType(status: number) {
  if (status === 0) return "success";
  if (status === 1) return "warning";
  if (status === 2) return "primary";
  return "info";
}

async function loadTemplates() {
  tplLoading.value = true;
  try {
    const { data } = await fetchCouponTemplates();
    templates.value = data.data || [];
  } finally {
    tplLoading.value = false;
  }
}

async function loadRecords() {
  logLoading.value = true;
  try {
    const { data } = await fetchCouponRecords({
      couponNo: couponNo.value || undefined,
      memberNo: recordMemberNo.value || undefined,
      status: recordStatus.value,
    });
    records.value = data.data || [];
  } finally {
    logLoading.value = false;
  }
}

function onIssueTypeChange() {
  if (form.issueType === "CLAIM") {
    form.thresholdAmount = 0;
    form.benefitValue = 8;
  } else if (form.benefitValue >= 10) {
    form.benefitValue = 5;
  }
}

function resetForm() {
  form.id = 0;
  form.name = "";
  form.issueType = "REGISTER";
  form.thresholdAmount = 10;
  form.benefitValue = 5;
  form.validDays = 7;
  form.totalQuota = 0;
  form.status = 1;
  claimRange.value = null;
}

function openCreate() {
  resetForm();
  tplVisible.value = true;
}

function openEdit(row: AdminCouponTemplateVO) {
  form.id = row.id;
  form.name = row.name;
  form.issueType = row.issueType;
  form.thresholdAmount = Number(row.thresholdAmount || 0);
  form.benefitValue = Number(row.benefitValue || 0);
  form.validDays = row.validDays;
  form.totalQuota = row.totalQuota || 0;
  form.status = row.status;
  claimRange.value = row.claimStart && row.claimEnd ? [toPickerTime(row.claimStart), toPickerTime(row.claimEnd)] : null;
  tplVisible.value = true;
}

function toPickerTime(v?: string) {
  return String(v || "").replace("T", " ").slice(0, 19);
}

function formatTime(v?: string) {
  if (!v) {
    return "-";
  }
  return String(v).replace("T", " ").slice(0, 16);
}

async function saveTemplate() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      issueType: form.issueType,
      thresholdAmount: form.issueType === "CLAIM" ? 0 : form.thresholdAmount,
      benefitValue: form.benefitValue,
      validDays: form.validDays,
      claimStart: form.issueType === "CLAIM" ? claimRange.value?.[0] || null : null,
      claimEnd: form.issueType === "CLAIM" ? claimRange.value?.[1] || null : null,
      totalQuota: form.issueType === "CLAIM" && form.totalQuota > 0 ? form.totalQuota : null,
      status: form.status,
    };
    if (form.id) {
      await updateCouponTemplate(form.id, payload);
    } else {
      await createCouponTemplate(payload);
    }
    ElMessage.success("已保存");
    tplVisible.value = false;
    await loadTemplates();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: AdminCouponTemplateVO) {
  const next = row.status === 1 ? 0 : 1;
  await updateCouponTemplateStatus(row.id, next);
  ElMessage.success(next === 1 ? "已启用" : "已停用");
  await loadTemplates();
}

function openIssue(row?: AdminCouponTemplateVO) {
  issueTemplateId.value = row?.id;
  issueMemberNos.value = "";
  issueVisible.value = true;
}

async function submitIssue() {
  if (!issueTemplateId.value) {
    ElMessage.warning("请选择券模板");
    return;
  }
  const nos = issueMemberNos.value
    .split(/[\s,，]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!nos.length) {
    ElMessage.warning("请填写用户ID");
    return;
  }
  issuing.value = true;
  try {
    const { data } = await issueCoupons({ templateId: issueTemplateId.value, memberNos: nos });
    ElMessage.success(`已发放 ${data.data || nos.length} 张`);
    issueVisible.value = false;
    await loadTemplates();
    if (tab.value === "log") {
      await loadRecords();
    }
  } finally {
    issuing.value = false;
  }
}

onMounted(() => {
  loadTemplates();
  loadRecords();
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
</style>
