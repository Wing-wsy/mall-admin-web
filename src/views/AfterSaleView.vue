<template>
  <div>
    <div class="toolbar">
      <el-input v-model="orderNo" placeholder="订单号" clearable style="width: 200px" @keyup.enter="load" />
      <el-input v-model="afterSaleNo" placeholder="售后单号" clearable style="width: 200px" @keyup.enter="load" />
      <el-select v-model="type" clearable placeholder="类型" style="width: 140px">
        <el-option :value="1" label="仅退款" />
        <el-option :value="2" label="退货退款" />
      </el-select>
      <el-select v-model="status" clearable placeholder="状态" style="width: 150px">
        <el-option :value="10" label="待审核" />
        <el-option :value="20" label="待寄回" />
        <el-option :value="21" label="待商家收货" />
        <el-option :value="30" label="退款中" />
        <el-option :value="40" label="已拒绝" />
        <el-option :value="50" label="已撤销" />
        <el-option :value="60" label="已完成" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="afterSaleNo" label="售后单号" min-width="180" />
      <el-table-column prop="orderNo" label="订单号" min-width="170" />
      <el-table-column prop="memberNo" label="用户ID" min-width="120">
        <template #default="{ row }">{{ row.memberNo || "-" }}</template>
      </el-table-column>
      <el-table-column prop="typeText" label="类型" width="110" />
      <el-table-column label="退款" width="120">
        <template #default="{ row }">{{ refundText(row) }}</template>
      </el-table-column>
      <el-table-column prop="statusText" label="状态" width="120" />
      <el-table-column prop="createTime" label="申请时间" min-width="170" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button v-if="row.canApprove" link type="primary" @click="openDetail(row)">审核</el-button>
          <el-button v-if="row.canReceive" link type="primary" @click="openDetail(row)">收货</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="售后详情" width="720px">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="售后单号">{{ detail.afterSaleNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.statusText }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ detail.typeText }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ detail.memberNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="退款">{{ refundText(detail) }}</el-descriptions-item>
          <el-descriptions-item label="原因">{{ detail.reasonText }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.remark" label="说明">{{ detail.remark }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.rejectReason" label="拒绝原因" :span="2">
            {{ detail.rejectReason }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.returnExpressNo" label="退货物流" :span="2">
            {{ detail.returnExpressCompanyName }} {{ detail.returnExpressNo }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.returnAddress" label="退货地址" :span="2">
            {{ detail.returnName }} {{ detail.returnPhone }} {{ detail.returnAddress }}
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="detail.images?.length" class="imgs">
          <el-image
            v-for="url in detail.images"
            :key="url"
            :src="url"
            :preview-src-list="detail.images"
            fit="cover"
            class="img"
          />
        </div>
        <el-table :data="detail.items || []" border style="margin-top: 16px">
          <el-table-column prop="productName" label="商品" min-width="160" />
          <el-table-column prop="specName" label="规格" width="80" />
          <el-table-column prop="quantity" label="数量" width="70" />
          <el-table-column prop="amount" label="小计" width="90" />
        </el-table>
        <el-timeline v-if="detail.logs?.length" style="margin-top: 20px">
          <el-timeline-item v-for="(log, idx) in detail.logs" :key="idx" :timestamp="formatTime(log.createTime)">
            {{ log.actionText }}{{ log.remark ? " · " + log.remark : "" }}
          </el-timeline-item>
        </el-timeline>
        <el-form v-if="detail.canApprove" label-width="88px" style="margin-top: 16px">
          <el-form-item label="处理为">
            <el-radio-group v-model="approveType">
              <el-radio :value="1">仅退款（立即退）</el-radio>
              <el-radio :value="2" :disabled="detail.orderStatus === 20">退货退款（等寄回）</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="visible = false">关闭</el-button>
        <el-button v-if="detail?.canReject" @click="onReject">拒绝</el-button>
        <el-button v-if="detail?.canApprove" type="primary" @click="onApprove">同意</el-button>
        <el-button v-if="detail?.canReceive" type="primary" @click="onReceive">确认收到退货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  approveAfterSale,
  fetchAfterSaleDetail,
  fetchAfterSaleList,
  receiveAfterSale,
  rejectAfterSale,
  type AdminAfterSaleVO,
} from "@/api/aftersale";

const list = ref<AdminAfterSaleVO[]>([]);
const loading = ref(false);
const orderNo = ref("");
const afterSaleNo = ref("");
const type = ref<number | undefined>();
const status = ref<number | undefined>();
const visible = ref(false);
const detail = ref<AdminAfterSaleVO | null>(null);
const approveType = ref(1);

function refundText(row: AdminAfterSaleVO) {
  if (row.orderType === 1) {
    return `${row.refundPoints || 0} 积分`;
  }
  if (row.orderType === 2) {
    return "兑换券";
  }
  return `¥${Number(row.refundAmount || 0).toFixed(2)}`;
}

function formatTime(t?: string) {
  if (!t) {
    return "";
  }
  return String(t).replace("T", " ").slice(0, 19);
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchAfterSaleList({
      status: status.value,
      type: type.value,
      orderNo: orderNo.value || undefined,
      afterSaleNo: afterSaleNo.value || undefined,
    });
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

async function openDetail(row: AdminAfterSaleVO) {
  const { data } = await fetchAfterSaleDetail(row.id);
  detail.value = data.data;
  approveType.value = data.data?.type === 2 ? 2 : 1;
  visible.value = true;
}

async function onApprove() {
  if (!detail.value) {
    return;
  }
  await ElMessageBox.confirm(
    approveType.value === 2 ? "同意后退货退款，等待用户寄回。" : "同意后将立即整单退款。",
    "同意售后"
  );
  await approveAfterSale(detail.value.id, approveType.value);
  ElMessage.success("已同意");
  visible.value = false;
  await load();
}

async function onReject() {
  if (!detail.value) {
    return;
  }
  const { value } = await ElMessageBox.prompt("请填写拒绝原因", "拒绝售后", {
    inputPattern: /\S+/,
    inputErrorMessage: "请填写原因",
  });
  await rejectAfterSale(detail.value.id, String(value).trim());
  ElMessage.success("已拒绝");
  visible.value = false;
  await load();
}

async function onReceive() {
  if (!detail.value) {
    return;
  }
  await ElMessageBox.confirm("确认已收到退货？将回库存并完成退款。", "确认收货");
  await receiveAfterSale(detail.value.id);
  ElMessage.success("已退款");
  visible.value = false;
  await load();
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
.imgs {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.img {
  width: 88px;
  height: 88px;
  border-radius: 6px;
}
</style>
