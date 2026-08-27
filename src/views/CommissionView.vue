<template>
  <div>
    <div class="toolbar">
      <el-input v-model="orderNo" placeholder="订单号" clearable style="width: 220px" @keyup.enter="load" />
      <el-input
        v-model="sellerMemberNo"
        placeholder="供货会员ID"
        clearable
        style="width: 180px"
        @keyup.enter="load"
      />
      <el-select v-model="settleStatus" clearable placeholder="结算状态" style="width: 140px">
        <el-option :value="1" label="待入账" />
        <el-option :value="2" label="已入账" />
        <el-option :value="3" label="已冲回" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="sellerMemberNo" label="供货会员" min-width="140">
        <template #default="{ row }">{{ row.sellerMemberNo || "-" }}</template>
      </el-table-column>
      <el-table-column prop="sellerLevelName" label="供货等级" width="120">
        <template #default="{ row }">{{ row.sellerLevelName || "-" }}</template>
      </el-table-column>
      <el-table-column label="发货方" width="120">
        <template #default="{ row }">{{ row.supplierName || (row.supplierId ? "供应商" : "自营") }}</template>
      </el-table-column>
      <el-table-column prop="buyerMemberNo" label="买家" min-width="140">
        <template #default="{ row }">{{ row.buyerMemberNo || "-" }}</template>
      </el-table-column>
      <el-table-column label="实付" width="110">
        <template #default="{ row }">¥{{ money(row.payAmount) }}</template>
      </el-table-column>
      <el-table-column label="抽成比例" width="100">
        <template #default="{ row }">{{ rateText(row.commissionRate) }}%</template>
      </el-table-column>
      <el-table-column label="抽成金额" width="110">
        <template #default="{ row }">¥{{ money(row.commissionAmount) }}</template>
      </el-table-column>
      <el-table-column label="会员入账" width="110">
        <template #default="{ row }">¥{{ money(row.sellerIncome) }}</template>
      </el-table-column>
      <el-table-column prop="settleStatusText" label="结算" width="100">
        <template #default="{ row }">
          <el-tag :type="settleType(row.settleStatus)">{{ row.settleStatusText || "-" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="orderStatusText" label="订单状态" width="100" />
      <el-table-column prop="finishTime" label="完成时间" min-width="170">
        <template #default="{ row }">{{ row.finishTime || "-" }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="下单时间" min-width="170" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">订单详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="订单详情" width="720px">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.status)" :class="'st-' + detail.status">{{ detail.statusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发货方">{{ detail.supplierName || (detail.supplierId ? "供应商" : "自营") }}</el-descriptions-item>
          <el-descriptions-item label="买家">{{ detail.memberNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="供货会员">{{ detail.sellerMemberNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="供货等级">{{ detail.sellerLevelName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="实付">¥{{ money(detail.payAmount) }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.settleStatus" label="供货抽成">
            {{ rateText(detail.commissionRate) }}% / ¥{{ money(detail.commissionAmount) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.settleStatus" label="会员入账">
            ¥{{ money(detail.sellerIncome) }}（{{ detail.settleStatusText }}）
          </el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detail.receiverName }} {{ detail.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ detail.receiverAddress }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.expressNo" label="物流">
            {{ detail.expressCompanyName || detail.expressCompany }} {{ detail.expressNo }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.buyerRemark" label="备注" :span="2">{{ detail.buyerRemark }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="detail.items || []" border style="margin-top: 16px">
          <el-table-column label="商品" min-width="160">
            <template #default="{ row }">
              <el-button v-if="row.productId" link type="primary" @click="openProduct(row.productId)">
                {{ row.productName }}
              </el-button>
              <span v-else>{{ row.productName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="specName" label="规格" width="80" />
          <el-table-column prop="price" label="单价" width="90" />
          <el-table-column prop="quantity" label="数量" width="70" />
          <el-table-column prop="amount" label="小计" width="90" />
        </el-table>
      </template>
    </el-dialog>
    <ProductDetailDialog v-model="productVisible" :product-id="productId" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import ProductDetailDialog from "@/components/ProductDetailDialog.vue";
import { fetchAdminCommissionList, type AdminCommissionVO } from "@/api/commission";
import { fetchAdminOrderDetail, type AdminOrderVO } from "@/api/order";

const list = ref<AdminCommissionVO[]>([]);
const loading = ref(false);
const orderNo = ref("");
const sellerMemberNo = ref("");
const settleStatus = ref<number | undefined>();
const visible = ref(false);
const detail = ref<AdminOrderVO | null>(null);
const productVisible = ref(false);
const productId = ref<number>();

function money(v: unknown) {
  return Number(v || 0).toFixed(2);
}

function rateText(v: unknown) {
  const n = Number(v || 0);
  return String(n).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function settleType(s?: number) {
  if (s === 2) return "success";
  if (s === 3) return "danger";
  if (s === 1) return "warning";
  return "info";
}

function statusType(s: number) {
  if (s === 10) return "warning";
  if (s === 20) return "primary";
  if (s === 30) return "";
  if (s === 40) return "success";
  if (s === 60) return "danger";
  return "info";
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchAdminCommissionList({
      orderNo: orderNo.value || undefined,
      sellerMemberNo: sellerMemberNo.value || undefined,
      settleStatus: settleStatus.value,
    });
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

async function openDetail(row: AdminCommissionVO) {
  const { data } = await fetchAdminOrderDetail(row.orderId);
  detail.value = data.data;
  visible.value = true;
}

function openProduct(id: number) {
  productId.value = id;
  productVisible.value = true;
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
.st-10 {
  --el-tag-bg-color: #fef3c7;
  --el-tag-border-color: #f59e0b;
  --el-tag-text-color: #b45309;
}
.st-20 {
  --el-tag-bg-color: #dbeafe;
  --el-tag-border-color: #3b82f6;
  --el-tag-text-color: #1d4ed8;
}
.st-30 {
  --el-tag-bg-color: #ede9fe;
  --el-tag-border-color: #8b5cf6;
  --el-tag-text-color: #6d28d9;
}
.st-40 {
  --el-tag-bg-color: #dcfce7;
  --el-tag-border-color: #22c55e;
  --el-tag-text-color: #15803d;
}
.st-50 {
  --el-tag-bg-color: #f3f4f6;
  --el-tag-border-color: #9ca3af;
  --el-tag-text-color: #6b7280;
}
.st-60 {
  --el-tag-bg-color: #fee2e2;
  --el-tag-border-color: #ef4444;
  --el-tag-text-color: #b91c1c;
}
</style>
