<template>
  <div>
    <div class="toolbar">
      <el-input v-model="orderNo" placeholder="订单号" clearable style="width: 220px" @keyup.enter="load" />
      <el-select v-model="status" clearable placeholder="状态" style="width: 140px">
        <el-option :value="10" label="待付款" />
        <el-option :value="20" label="待发货" />
        <el-option :value="30" label="待收货" />
        <el-option :value="40" label="已完成" />
        <el-option :value="50" label="已取消" />
      </el-select>
      <el-select v-model="orderType" placeholder="订单类型" style="width: 160px">
        <el-option value="" label="全部" />
        <el-option value="0" label="支付金额订单" />
        <el-option value="1" label="积分兑换订单" />
        <el-option value="2" label="兑换券订单" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="memberNo" label="用户ID" min-width="140">
        <template #default="{ row }">{{ row.memberNo || "-" }}</template>
      </el-table-column>
      <el-table-column label="商品" min-width="220">
        <template #default="{ row }">
          <div v-if="row.items?.length" class="goods">
            <div v-for="item in row.items" :key="item.id" class="goods-line">
              {{ item.productName }}{{ item.specName ? " " + item.specName : "" }} x{{ item.quantity }}
            </div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="payAmount" label="应付" width="120">
        <template #default="{ row }">
          <span v-if="row.orderType === 1">{{ row.pointsAmount || 0 }} 积分</span>
          <span v-else-if="row.orderType === 2">兑换券</span>
          <span v-else>¥{{ row.payAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付" width="110">
        <template #default="{ row }">
          {{ row.orderType === 1 ? "积分兑换" : row.orderType === 2 ? "兑换券" : row.payChannel || "-" }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" :class="'st-' + row.status">{{ row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="receiverName" label="收货人" width="100" />
      <el-table-column prop="createTime" label="下单时间" min-width="170" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button v-if="row.status === 20" link type="primary" @click="onShip(row)">发货</el-button>
          <el-button v-if="row.status === 10 || row.status === 20" link type="danger" @click="onCancel(row)">
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="订单详情" width="720px">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ detail.memberNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.status)" :class="'st-' + detail.status">{{ detail.statusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.orderType !== 1 && detail.orderType !== 2" label="商品金额">
            ¥{{ detail.goodsAmount }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.orderType !== 1 && detail.orderType !== 2" label="运费">
            {{ Number(detail.freightAmount) > 0 ? `¥${detail.freightAmount}` : "免运费" }}
          </el-descriptions-item>
          <el-descriptions-item label="应付">
            <span v-if="detail.orderType === 1">{{ detail.pointsAmount || 0 }} 积分</span>
            <span v-else-if="detail.orderType === 2">兑换券 / ¥0</span>
            <span v-else>¥{{ detail.payAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.orderType !== 1 && detail.orderType !== 2" label="优惠券">{{ detail.couponName || "未使用" }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.orderType !== 1 && detail.orderType !== 2 && detail.couponAmount" label="优惠金额">-¥{{ detail.couponAmount }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.memberLevelName" label="会员等级">{{ detail.memberLevelName }}{{ detail.memberDiscount ? `（${detail.memberDiscount}折）` : "" }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.memberDiscountAmount" label="会员减免">-¥{{ detail.memberDiscountAmount }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.orderType === 2" label="验证码">{{ detail.voucherCodeMask || "-" }}</el-descriptions-item>
          <el-descriptions-item label="支付渠道">
            {{ detail.orderType === 1 ? "积分兑换" : detail.orderType === 2 ? "兑换券" : detail.payChannel || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detail.receiverName }} {{ detail.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ detail.receiverAddress }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.expressNo" label="物流">
            <span>{{ detail.expressCompanyName || detail.expressCompany }} {{ detail.expressNo }}</span>
            <el-button link type="primary" style="margin-left: 8px" @click="openExpress">查询物流</el-button>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.expressNo" label="发货时间">{{ detail.shipTime || "-" }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.buyerRemark" label="备注" :span="2">{{ detail.buyerRemark }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.cancelReason" label="取消原因" :span="2">{{ detail.cancelReason }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="detail.items || []" border style="margin-top: 16px">
          <el-table-column label="商品" min-width="160">
            <template #default="{ row }">
              <el-button
                v-if="row.productId"
                link
                type="primary"
                @click="openProduct(row.productId)"
              >
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

    <el-dialog v-model="expressVisible" title="物流信息" width="520px" @closed="resetExpress">
      <div v-loading="expressLoading">
        <template v-if="expressDetail">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="物流状态">{{ expressDetail.expressStateText || "-" }}</el-descriptions-item>
            <el-descriptions-item label="承运商">{{ expressDetail.expressCompanyName || "-" }}</el-descriptions-item>
            <el-descriptions-item label="运单号">{{ expressDetail.expressNo || "-" }}</el-descriptions-item>
          </el-descriptions>
          <el-timeline v-if="expressDetail.traces?.length" style="margin-top: 20px; padding-left: 4px">
            <el-timeline-item
              v-for="(item, idx) in expressDetail.traces"
              :key="idx"
              :type="idx === 0 ? 'primary' : undefined"
              :timestamp="formatTraceTime(item.time)"
              placement="top"
            >
              <div>{{ item.context }}</div>
              <div v-if="item.location" class="trace-loc">{{ item.location }}</div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无物流轨迹" :image-size="72" />
        </template>
      </div>
    </el-dialog>

    <ProductDetailDialog v-model="productVisible" :product-id="productId" />

    <el-dialog v-model="shipVisible" title="发货" width="420px" @closed="resetShip">
      <el-form label-width="88px">
        <el-form-item label="订单号">{{ shipRow?.orderNo }}</el-form-item>
        <el-form-item label="快递公司" required>
          <el-select v-model="shipForm.expressCompany" placeholder="请选择快递公司" style="width: 100%">
            <el-option v-for="c in companies" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="运单号" required>
          <el-input v-model="shipForm.expressNo" placeholder="请输入运单号" maxlength="64" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipping" @click="submitShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProductDetailDialog from "@/components/ProductDetailDialog.vue";
import {
  cancelAdminOrder,
  fetchAdminOrderDetail,
  fetchAdminOrderExpress,
  fetchAdminOrderList,
  shipAdminOrder,
  type AdminExpressVO,
  type AdminOrderVO,
} from "@/api/order";

const list = ref<AdminOrderVO[]>([]);
const loading = ref(false);
const orderNo = ref("");
const status = ref<number | undefined>();
const orderType = ref("");
const visible = ref(false);
const detail = ref<AdminOrderVO | null>(null);
const productVisible = ref(false);
const productId = ref<number>();
const expressVisible = ref(false);
const expressLoading = ref(false);
const expressDetail = ref<AdminExpressVO | null>(null);
const shipVisible = ref(false);
const shipping = ref(false);
const shipRow = ref<AdminOrderVO | null>(null);
const shipForm = ref({ expressCompany: "", expressNo: "" });
const companies = [
  { value: "sf", label: "顺丰速运" },
  { value: "zto", label: "中通快递" },
  { value: "yto", label: "圆通速递" },
  { value: "yd", label: "韵达快递" },
  { value: "jd", label: "京东物流" },
  { value: "sto", label: "申通快递" },
];

function statusType(s: number) {
  if (s === 10) return "warning";
  if (s === 20) return "primary";
  if (s === 30) return "";
  if (s === 40) return "success";
  return "info";
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchAdminOrderList({
      status: status.value,
      orderType: orderType.value === "" ? undefined : Number(orderType.value),
      orderNo: orderNo.value || undefined,
    });
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

async function openDetail(row: AdminOrderVO) {
  const { data } = await fetchAdminOrderDetail(row.id);
  detail.value = data.data;
  visible.value = true;
}

function openProduct(id: number) {
  productId.value = id;
  productVisible.value = true;
}

async function openExpress() {
  if (!detail.value?.id) {
    return;
  }
  expressVisible.value = true;
  expressLoading.value = true;
  expressDetail.value = null;
  try {
    const { data } = await fetchAdminOrderExpress(detail.value.id);
    expressDetail.value = data.data;
  } catch {
    expressVisible.value = false;
  } finally {
    expressLoading.value = false;
  }
}

function resetExpress() {
  expressDetail.value = null;
}

function formatTraceTime(t?: string) {
  if (!t) {
    return "";
  }
  return String(t).replace("T", " ").slice(0, 19);
}

async function onShip(row: AdminOrderVO) {
  shipRow.value = row;
  shipForm.value = { expressCompany: "", expressNo: "" };
  shipVisible.value = true;
}

function resetShip() {
  shipRow.value = null;
  shipForm.value = { expressCompany: "", expressNo: "" };
}

async function submitShip() {
  if (!shipRow.value) {
    return;
  }
  if (!shipForm.value.expressCompany) {
    ElMessage.warning("请选择快递公司");
    return;
  }
  if (!shipForm.value.expressNo.trim()) {
    ElMessage.warning("请填写运单号");
    return;
  }
  shipping.value = true;
  try {
    await shipAdminOrder(shipRow.value.id, {
      expressCompany: shipForm.value.expressCompany,
      expressNo: shipForm.value.expressNo.trim(),
    });
    ElMessage.success("已发货");
    shipVisible.value = false;
    await load();
  } finally {
    shipping.value = false;
  }
}

async function onCancel(row: AdminOrderVO) {
  await ElMessageBox.confirm(
    row.orderType === 2
      ? `取消订单 ${row.orderNo} 将回补库存，并把验证码打回未使用，确认吗？`
      : `取消订单 ${row.orderNo} 将回补库存，确认吗？`,
    "取消订单"
  );
  await cancelAdminOrder(row.id, "后台取消");
  ElMessage.success("已取消");
  await load();
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.goods {
  line-height: 1.4;
}
.goods-line + .goods-line {
  margin-top: 4px;
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
.trace-loc {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 12px;
}
</style>
