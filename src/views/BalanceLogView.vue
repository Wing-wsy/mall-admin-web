<template>
  <div>
    <div class="toolbar">
      <el-input v-model="memberNo" placeholder="用户ID" clearable style="width: 200px" @keyup.enter="load" />
      <el-input v-model="orderNo" placeholder="订单号" clearable style="width: 220px" @keyup.enter="load" />
      <el-select v-model="bizType" clearable placeholder="流水类型" style="width: 180px">
        <el-option value="SETTLE" label="订单完成入账" />
        <el-option value="CLAWBACK" label="售后退回" />
        <el-option value="SHARE_SETTLE" label="分享佣金入账" />
        <el-option value="SHARE_CLAWBACK" label="分享佣金冲回" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-descriptions v-if="account" :column="4" border class="summary">
      <el-descriptions-item label="用户ID">{{ account.memberNo || "-" }}</el-descriptions-item>
      <el-descriptions-item label="昵称">{{ account.nickname || "-" }}</el-descriptions-item>
      <el-descriptions-item label="手机号">{{ account.phone || "-" }}</el-descriptions-item>
      <el-descriptions-item label="当前余额">
        <span class="balance">¥{{ money(account.balance) }}</span>
      </el-descriptions-item>
    </el-descriptions>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="createTime" label="时间" min-width="170" />
      <el-table-column prop="bizTypeText" label="类型" width="140">
        <template #default="{ row }">
          <el-tag :type="typeTag(row.bizType)" size="small">{{ row.bizTypeText || "-" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="变动金额" width="130">
        <template #default="{ row }">
          <span :class="Number(row.changeAmount) >= 0 ? 'in' : 'out'">
            {{ Number(row.changeAmount) >= 0 ? "+" : "" }}¥{{ money(row.changeAmount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="变动后余额" width="130">
        <template #default="{ row }">¥{{ money(row.afterAmount) }}</template>
      </el-table-column>
      <el-table-column prop="orderNo" label="关联订单" min-width="180">
        <template #default="{ row }">
          <el-button v-if="row.orderId" link type="primary" @click="openDetail(row)">{{ row.orderNo || row.orderId }}</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="240">
        <template #default="{ row }">{{ row.remark || "-" }}</template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="订单详情" width="720px">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ detail.memberNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="实付">¥{{ money(detail.payAmount) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.statusText || "-" }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { fetchAdminBalanceLogs, type AdminBalanceAccountVO, type AdminBalanceLogVO } from "@/api/balance";
import { fetchAdminOrderDetail, type AdminOrderVO } from "@/api/order";

const route = useRoute();
const memberNo = ref("");
const orderNo = ref("");
const bizType = ref<string | undefined>();
const loading = ref(false);
const account = ref<AdminBalanceAccountVO | null>(null);
const list = ref<AdminBalanceLogVO[]>([]);
const visible = ref(false);
const detail = ref<AdminOrderVO | null>(null);

function money(v: unknown) {
  return Number(v || 0).toFixed(2);
}

function typeTag(type?: string) {
  if (type === "SETTLE" || type === "SHARE_SETTLE") return "success";
  if (type === "CLAWBACK" || type === "SHARE_CLAWBACK") return "danger";
  return "info";
}

async function load() {
  if (!memberNo.value.trim()) {
    ElMessage.warning("请填写用户ID");
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchAdminBalanceLogs({
      memberNo: memberNo.value.trim(),
      orderNo: orderNo.value.trim() || undefined,
      bizType: bizType.value || undefined,
    });
    account.value = data.data || null;
    list.value = data.data?.list || [];
  } finally {
    loading.value = false;
  }
}

async function openDetail(row: AdminBalanceLogVO) {
  if (!row.orderId) {
    return;
  }
  const { data } = await fetchAdminOrderDetail(row.orderId);
  detail.value = data.data;
  visible.value = true;
}

onMounted(() => {
  const fromQuery = String(route.query.memberNo || "").trim();
  if (fromQuery) {
    memberNo.value = fromQuery;
    load();
  }
});

watch(
  () => String(route.query.memberNo || "").trim(),
  (no) => {
    if (no && no !== memberNo.value) {
      memberNo.value = no;
      load();
    }
  }
);
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.summary {
  margin-bottom: 16px;
}
.balance {
  font-weight: 700;
  color: #111827;
}
.in {
  color: #15803d;
  font-weight: 600;
}
.out {
  color: #b91c1c;
  font-weight: 600;
}
</style>
