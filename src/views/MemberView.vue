<template>
  <div>
    <div class="toolbar">
      <el-input v-model="memberNo" placeholder="用户ID" clearable style="width: 180px" @keyup.enter="load" />
      <el-input v-model="nickname" placeholder="昵称" clearable style="width: 180px" @keyup.enter="load" />
      <el-input v-model="phone" placeholder="手机号" clearable style="width: 180px" @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="memberNo" label="用户ID" min-width="140">
        <template #default="{ row }">{{ row.memberNo || "-" }}</template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" min-width="140">
        <template #default="{ row }">{{ row.nickname || "-" }}</template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="140">
        <template #default="{ row }">{{ row.phone || "-" }}</template>
      </el-table-column>
      <el-table-column prop="levelName" label="会员等级" width="120">
        <template #default="{ row }">{{ row.levelName || "-" }}</template>
      </el-table-column>
      <el-table-column prop="points" label="积分" width="90">
        <template #default="{ row }">{{ row.points ?? 0 }}</template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" width="110">
        <template #default="{ row }">¥{{ Number(row.balance ?? 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="收货地址" width="100">
        <template #default="{ row }">{{ row.addressCount || 0 }} 条</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? "正常" : "停用" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注册时间" min-width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="openIssue(row)">发券</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="用户详情" width="720px">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ detail.memberNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            {{ detail.status === 1 ? "正常" : "停用" }}
          </el-descriptions-item>
          <el-descriptions-item label="用户昵称">{{ detail.nickname || "-" }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.phone || "-" }}</el-descriptions-item>
          <el-descriptions-item label="会员等级">{{ detail.levelName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ detail.points ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="余额">¥{{ Number(detail.balance ?? 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="注册时间" :span="2">{{ detail.createTime || "-" }}</el-descriptions-item>
        </el-descriptions>
        <div class="addr-title">收货地址</div>
        <el-table v-if="detail.addresses?.length" :data="detail.addresses" border>
          <el-table-column label="默认" width="70">
            <template #default="{ row }">
              <el-tag v-if="row.isDefault" type="danger" size="small">默认</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="receiverName" label="收货人" width="100" />
          <el-table-column prop="receiverPhone" label="手机号" width="130" />
          <el-table-column prop="fullAddress" label="地址" min-width="240" />
        </el-table>
        <el-empty v-else description="暂无收货地址" :image-size="64" />
      </template>
    </el-dialog>

    <el-dialog v-model="issueVisible" title="给用户发券" width="480px">
      <el-form label-width="88px">
        <el-form-item label="用户ID">{{ issueMemberNo }}</el-form-item>
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
      </el-form>
      <template #footer>
        <el-button @click="issueVisible = false">取消</el-button>
        <el-button type="primary" :loading="issuing" @click="submitIssue">发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchAdminMemberDetail, fetchAdminMemberList, type AdminMemberVO } from "@/api/member";
import { fetchCouponTemplates, issueCoupons, type AdminCouponTemplateVO } from "@/api/coupon";

const list = ref<AdminMemberVO[]>([]);
const loading = ref(false);
const nickname = ref("");
const memberNo = ref("");
const phone = ref("");
const visible = ref(false);
const detail = ref<AdminMemberVO | null>(null);
const issueVisible = ref(false);
const issuing = ref(false);
const issueMemberNo = ref("");
const issueTemplateId = ref<number>();
const enabledTemplates = ref<AdminCouponTemplateVO[]>([]);

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchAdminMemberList({
      memberNo: memberNo.value || undefined,
      nickname: nickname.value || undefined,
      phone: phone.value || undefined,
    });
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function reset() {
  memberNo.value = "";
  nickname.value = "";
  phone.value = "";
  load();
}

async function openDetail(row: AdminMemberVO) {
  const { data } = await fetchAdminMemberDetail(row.memberNo);
  detail.value = data.data;
  visible.value = true;
}

async function openIssue(row: AdminMemberVO) {
  issueMemberNo.value = row.memberNo;
  issueTemplateId.value = undefined;
  const { data } = await fetchCouponTemplates();
  enabledTemplates.value = (data.data || []).filter((t) => t.status === 1);
  issueVisible.value = true;
}

async function submitIssue() {
  if (!issueTemplateId.value) {
    ElMessage.warning("请选择券模板");
    return;
  }
  issuing.value = true;
  try {
    await issueCoupons({ templateId: issueTemplateId.value, memberNos: [issueMemberNo.value] });
    ElMessage.success("已发放");
    issueVisible.value = false;
  } finally {
    issuing.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.addr-title {
  margin: 16px 0 8px;
  font-weight: 600;
}
</style>
