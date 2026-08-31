<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane label="等级配置" name="level" />
      <el-tab-pane label="手机号名单" name="phone" />
      <el-tab-pane label="邀请链接" name="invite" />
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
        <el-table-column label="特权" min-width="120">
          <template #default="{ row }">{{ row.privilegesText || "-" }}</template>
        </el-table-column>
        <el-table-column label="供应商上限" width="110">
          <template #default="{ row }">
            {{ (row.privileges || []).includes("SUPPLIER") ? row.supplierMax || "-" : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="商品上限" width="100">
          <template #default="{ row }">
            {{ (row.privileges || []).includes("SUPPLIER") ? row.productMax || "-" : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="供货抽成" width="110">
          <template #default="{ row }">{{ strip(row.commissionRate) }}%</template>
        </el-table-column>
        <el-table-column label="分享抽成" width="110">
          <template #default="{ row }">
            {{ (row.privileges || []).includes("SHARE") ? `${strip(row.shareCommissionRate)}%` : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="分享比例" min-width="140">
          <template #default="{ row }">
            {{
              (row.privileges || []).includes("SHARE")
                ? `${strip(row.shareRateMin)}%~${strip(row.shareRateMax)}%`
                : "-"
            }}
          </template>
        </el-table-column>
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

    <div v-show="tab === 'invite'">
      <div class="toolbar">
        <el-select v-model="inviteLevelId" clearable placeholder="等级" style="width: 160px">
          <el-option v-for="lv in levels" :key="lv.id" :label="lv.name" :value="lv.id" />
        </el-select>
        <el-button type="primary" @click="loadInvites">查询</el-button>
        <el-button type="primary" @click="openInviteCreate">生成链接</el-button>
      </div>
      <el-table :data="invites" v-loading="inviteLoading" border stripe>
        <el-table-column prop="levelName" label="等级" width="120" />
        <el-table-column prop="expireAt" label="失效时间" min-width="170" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.statusText === '有效' ? 'success' : 'info'">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="环境" width="90">
          <template #default="{ row }">{{ envLabel(row.envVersion) }}</template>
        </el-table-column>
        <el-table-column label="已开通" width="110">
          <template #default="{ row }">{{ row.redeemCount || 0 }}/{{ row.maxUses || "-" }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="createTime" label="生成时间" min-width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="copyText(row.urlLink || row.miniPath)">复制链接</el-button>
            <el-button link @click="copyText(row.miniPath)">复制路径</el-button>
            <el-button link @click="openInviteLogs(row)">记录</el-button>
            <el-button v-if="row.status === 1 && row.statusText === '有效'" link type="danger" @click="onRevokeInvite(row)">
              作废
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="levelVisible" :title="levelForm.id ? '编辑等级' : '新增等级'" width="560px">
      <el-form label-width="108px">
        <el-form-item label="名称" required>
          <el-input v-model="levelForm.name" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="折扣" required>
          <el-input-number v-model="levelForm.discount" :min="0.1" :max="9.9" :step="0.1" :precision="1" />
          <span class="tip">8 表示 8 折，仅自营商品享受会员折扣</span>
        </el-form-item>
        <el-form-item label="优惠叠加" required>
          <el-radio-group v-model="levelForm.couponStackMode">
            <el-radio value="STACK">可与优惠券叠加</el-radio>
            <el-radio value="MUTEX">与优惠券二选一</el-radio>
          </el-radio-group>
          <div class="tip block">仅自营商品参与会员折。叠加：先会员折再按折后价用券。二选一：选券则取消会员折，券按原价计算。供应商商品全员原价，可单独用券。</div>
        </el-form-item>
        <el-form-item label="特权功能">
          <el-checkbox-group v-model="levelForm.privileges">
            <el-checkbox value="SUPPLIER">供应商</el-checkbox>
            <el-checkbox value="SHARE">分享</el-checkbox>
          </el-checkbox-group>
          <div class="tip block">勾选后出现对应配置，该等级会员可在小程序使用该功能。普通用户没有这些入口。</div>
        </el-form-item>
        <div v-if="levelForm.privileges.includes('SUPPLIER')" class="priv-block">
          <div class="priv-head">供应商</div>
          <el-form-item label="供应商上限" required>
            <el-input-number v-model="levelForm.supplierMax" :min="1" :max="99" />
            <span class="tip">待审批+已通过计入上限</span>
          </el-form-item>
          <el-form-item label="商品上限" required>
            <el-input-number v-model="levelForm.productMax" :min="1" :max="999" />
            <span class="tip">未删除且非驳回计入，按会员名下供应商汇总</span>
          </el-form-item>
          <el-form-item label="供货抽成">
            <el-input-number v-model="levelForm.commissionRate" :min="0" :max="100" :step="0.1" :precision="2" />
            <span class="tip">非自营订单按去掉加价后的实付抽成，2 表示 2%</span>
          </el-form-item>
        </div>
        <div v-if="levelForm.privileges.includes('SHARE')" class="priv-block priv-share">
          <div class="priv-head">分享</div>
          <el-form-item label="分享抽成" required>
            <el-input-number v-model="levelForm.shareCommissionRate" :min="0" :max="100" :step="0.1" :precision="2" />
            <span class="tip">加价差额抽成，20 表示 20%</span>
          </el-form-item>
          <el-form-item label="分享比例" required>
            <el-input-number v-model="levelForm.shareRateMin" :min="100" :max="999.99" :step="1" :precision="2" />
            <span class="range-sep">~</span>
            <el-input-number v-model="levelForm.shareRateMax" :min="100" :max="999.99" :step="1" :precision="2" />
            <span class="tip">含两端，120 表示 120%</span>
          </el-form-item>
        </div>
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

    <el-dialog v-model="inviteVisible" title="生成邀请链接" width="520px">
      <el-form label-width="108px">
        <el-form-item label="等级" required>
          <el-select v-model="inviteForm.levelId" style="width: 100%" placeholder="选择等级">
            <el-option
              v-for="lv in enabledLevels"
              :key="lv.id"
              :label="`${lv.name}（${strip(lv.discount)}折）`"
              :value="lv.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="失效时间" required>
          <el-date-picker
            v-model="inviteForm.expireAt"
            type="datetime"
            placeholder="最长 30 天"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="inviteDisabledDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="最多使用" required>
          <el-input-number v-model="inviteForm.maxUses" :min="1" :max="100000" :step="1" :precision="0" />
          <span class="tip">有效期内最多开通这么多人</span>
        </el-form-item>
        <el-form-item label="打开环境">
          <el-radio-group v-model="inviteForm.envVersion">
            <el-radio value="release">正式版</el-radio>
            <el-radio value="trial">体验版</el-radio>
            <el-radio value="develop">开发版</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="inviteForm.remark" maxlength="64" show-word-limit placeholder="可选，如发给某某渠道" />
        </el-form-item>
      </el-form>
      <div class="tip block" style="margin: 0 0 8px 108px">
        微信 URL Link 最长 30 天。本地 mock 时复制的是小程序路径，可在开发者工具打开。
      </div>
      <template #footer>
        <el-button @click="inviteVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveInvite">生成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logVisible" title="核销记录" width="720px">
      <el-table :data="inviteLogs" v-loading="logLoading" border stripe max-height="420">
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="memberNo" label="用户编号" min-width="120">
          <template #default="{ row }">{{ row.memberNo || "-" }}</template>
        </el-table-column>
        <el-table-column prop="fromLevelName" label="原等级" width="110" />
        <el-table-column prop="toLevelName" label="开通等级" width="110" />
        <el-table-column prop="createTime" label="时间" min-width="170" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import { uploadAdminFile } from "@/api/product";
import {
  batchCreateMemberLevelPhones,
  createMemberLevel,
  createMemberLevelInvite,
  createMemberLevelPhone,
  deleteMemberLevel,
  deleteMemberLevelPhone,
  fetchMemberLevelInviteLogs,
  fetchMemberLevelInvites,
  fetchMemberLevelPhones,
  fetchMemberLevels,
  revokeMemberLevelInvite,
  updateMemberLevel,
  updateMemberLevelPhone,
  updateMemberLevelStatus,
  type AdminMemberLevelInviteLogVO,
  type AdminMemberLevelInviteVO,
  type AdminMemberLevelPhoneVO,
  type AdminMemberLevelVO,
} from "@/api/level";

const tab = ref("level");
const levels = ref<AdminMemberLevelVO[]>([]);
const phones = ref<AdminMemberLevelPhoneVO[]>([]);
const invites = ref<AdminMemberLevelInviteVO[]>([]);
const inviteLogs = ref<AdminMemberLevelInviteLogVO[]>([]);
const levelLoading = ref(false);
const phoneLoading = ref(false);
const inviteLoading = ref(false);
const logLoading = ref(false);
const levelVisible = ref(false);
const phoneVisible = ref(false);
const batchVisible = ref(false);
const inviteVisible = ref(false);
const logVisible = ref(false);
const saving = ref(false);
const phoneQuery = ref("");
const phoneLevelId = ref<number | undefined>();
const inviteLevelId = ref<number | undefined>();

const levelForm = reactive({
  id: 0,
  name: "",
  iconUrl: "",
  discount: 8,
  couponStackMode: "STACK" as "STACK" | "MUTEX",
  privileges: [] as string[],
  supplierMax: 3,
  productMax: 10,
  commissionRate: 0,
  shareCommissionRate: 20,
  shareRateMin: 120,
  shareRateMax: 150,
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

const inviteForm = reactive({
  levelId: undefined as number | undefined,
  expireAt: "",
  maxUses: 1,
  envVersion: "release",
  remark: "",
});

const enabledLevels = computed(() => levels.value.filter((lv) => lv.status === 1));

function envLabel(value?: string) {
  if (value === "trial") return "体验版";
  if (value === "develop") return "开发版";
  return "正式版";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTime(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function defaultExpireAt() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return formatDateTime(d);
}

function inviteDisabledDate(date: Date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const max = new Date();
  max.setDate(max.getDate() + 30);
  max.setHours(23, 59, 59, 999);
  return date.getTime() < start.getTime() || date.getTime() > max.getTime();
}

async function copyText(text?: string) {
  if (!text) {
    ElMessage.warning("暂无可复制内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("复制失败，请手动复制");
  }
}

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
  levelForm.privileges = [];
  levelForm.supplierMax = 3;
  levelForm.productMax = 10;
  levelForm.commissionRate = 0;
  levelForm.shareCommissionRate = 20;
  levelForm.shareRateMin = 120;
  levelForm.shareRateMax = 150;
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
  levelForm.privileges = [...(row.privileges || [])];
  levelForm.supplierMax = row.supplierMax || 3;
  levelForm.productMax = row.productMax || 10;
  levelForm.commissionRate = Number(row.commissionRate ?? 0);
  levelForm.shareCommissionRate = Number(row.shareCommissionRate ?? 20);
  levelForm.shareRateMin = Number(row.shareRateMin || 120);
  levelForm.shareRateMax = Number(row.shareRateMax || 150);
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
      privileges: levelForm.privileges,
      supplierMax: levelForm.supplierMax,
      productMax: levelForm.productMax,
      commissionRate: levelForm.commissionRate,
      shareCommissionRate: levelForm.shareCommissionRate,
      shareRateMin: levelForm.shareRateMin,
      shareRateMax: levelForm.shareRateMax,
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

async function loadInvites() {
  inviteLoading.value = true;
  try {
    const { data } = await fetchMemberLevelInvites({
      levelId: inviteLevelId.value,
    });
    invites.value = data.data || [];
  } finally {
    inviteLoading.value = false;
  }
}

function openInviteCreate() {
  inviteForm.levelId = enabledLevels.value[0]?.id;
  inviteForm.expireAt = defaultExpireAt();
  inviteForm.maxUses = 1;
  inviteForm.envVersion = "release";
  inviteForm.remark = "";
  inviteVisible.value = true;
}

async function saveInvite() {
  if (!inviteForm.levelId || !inviteForm.expireAt) {
    ElMessage.warning("请选择等级和失效时间");
    return;
  }
  if (!inviteForm.maxUses || inviteForm.maxUses < 1) {
    ElMessage.warning("最多使用次数至少为1");
    return;
  }
  saving.value = true;
  try {
    const { data } = await createMemberLevelInvite({
      levelId: inviteForm.levelId,
      expireAt: inviteForm.expireAt,
      maxUses: inviteForm.maxUses,
      envVersion: inviteForm.envVersion,
      remark: inviteForm.remark.trim() || undefined,
    });
    ElMessage.success("已生成");
    inviteVisible.value = false;
    await loadInvites();
    const link = data.data?.urlLink || data.data?.miniPath;
    if (link) {
      await copyText(link);
    }
  } finally {
    saving.value = false;
  }
}

async function onRevokeInvite(row: AdminMemberLevelInviteVO) {
  await ElMessageBox.confirm(`确定作废「${row.levelName}」这条链接？作废后不可再开通。`, "提示", { type: "warning" });
  await revokeMemberLevelInvite(row.id);
  ElMessage.success("已作废");
  await loadInvites();
}

async function openInviteLogs(row: AdminMemberLevelInviteVO) {
  logVisible.value = true;
  logLoading.value = true;
  try {
    const { data } = await fetchMemberLevelInviteLogs(row.id);
    inviteLogs.value = data.data || [];
  } finally {
    logLoading.value = false;
  }
}

onMounted(() => {
  loadLevels();
  loadPhones();
  loadInvites();
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
.priv-block {
  margin: 0 0 16px;
  padding: 10px 12px 6px;
  background: #fff7f5;
  border: 1px solid #ffe4dc;
  border-radius: 8px;
}
.priv-block.priv-share {
  background: #f5f8ff;
  border-color: #dbe4ff;
}
.priv-head {
  margin: 0 0 8px 8px;
  font-size: 13px;
  font-weight: 600;
  color: #9a3412;
}
.priv-share .priv-head {
  color: #1e3a8a;
}
.range-sep {
  margin: 0 8px;
  color: #6b7280;
}
</style>
