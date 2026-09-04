<template>
  <div>
    <div class="toolbar">
      <el-input v-model="orderNo" placeholder="订单号" clearable style="width: 200px" @keyup.enter="search" />
      <el-input v-model="memberId" placeholder="用户ID(memberId)" clearable style="width: 180px" @keyup.enter="search" />
      <el-select v-model="rating" clearable placeholder="星级" style="width: 120px">
        <el-option v-for="n in 5" :key="n" :value="n" :label="`${n} 星`" />
      </el-select>
      <el-date-picker
        v-model="timeRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
        style="width: 360px"
      />
      <el-button type="primary" @click="search">查询</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="170">
        <template #default="{ row }">
          <el-button link type="primary" @click="openOrder(row)">{{ row.orderNo }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="memberNo" label="用户编号" min-width="120">
        <template #default="{ row }">{{ row.memberNo || "-" }}</template>
      </el-table-column>
      <el-table-column label="星级" width="120">
        <template #default="{ row }">
          <span class="stars">{{ "★".repeat(row.rating || 0) }}{{ "☆".repeat(5 - (row.rating || 0)) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="评价内容" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">{{ row.content || "-" }}</template>
      </el-table-column>
      <el-table-column label="图片" width="180">
        <template #default="{ row }">
          <div v-if="row.images?.length" class="imgs">
            <el-image
              v-for="url in row.images"
              :key="url"
              :src="url"
              :preview-src-list="row.images"
              fit="cover"
              class="img"
            />
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="评价时间" min-width="170">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="load"
        @size-change="search"
      />
    </div>

    <el-dialog v-model="orderVisible" title="订单详情" width="720px">
      <div v-loading="orderLoading">
        <template v-if="orderDetail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ orderDetail.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="发货方">
              {{ orderDetail.supplierName || (orderDetail.supplierId ? "供应商" : "自营") }}
            </el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ orderDetail.memberNo || "-" }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ orderDetail.statusText }}</el-descriptions-item>
            <el-descriptions-item v-if="orderDetail.orderType !== 1 && orderDetail.orderType !== 2" label="商品金额">
              ¥{{ orderDetail.goodsAmount }}
            </el-descriptions-item>
            <el-descriptions-item v-if="orderDetail.orderType !== 1 && orderDetail.orderType !== 2" label="运费">
              {{ Number(orderDetail.freightAmount) > 0 ? `¥${orderDetail.freightAmount}` : "免运费" }}
            </el-descriptions-item>
            <el-descriptions-item label="应付">
              <span v-if="orderDetail.orderType === 1">{{ orderDetail.pointsAmount || 0 }} 积分</span>
              <span v-else-if="orderDetail.orderType === 2">兑换券 / ¥0</span>
              <span v-else>¥{{ orderDetail.payAmount }}</span>
            </el-descriptions-item>
            <el-descriptions-item
              v-if="orderDetail.orderType !== 1 && orderDetail.orderType !== 2"
              label="优惠券"
            >
              {{ orderDetail.couponName || "未使用" }}
            </el-descriptions-item>
            <el-descriptions-item v-if="orderDetail.memberLevelName" label="会员等级">
              {{ orderDetail.memberLevelName
              }}{{ orderDetail.memberDiscount ? `（${orderDetail.memberDiscount}折）` : "" }}
            </el-descriptions-item>
            <el-descriptions-item v-if="orderDetail.memberDiscountAmount" label="会员减免">
              -¥{{ orderDetail.memberDiscountAmount }}
            </el-descriptions-item>
            <el-descriptions-item label="支付渠道">
              {{
                orderDetail.orderType === 1
                  ? "积分兑换"
                  : orderDetail.orderType === 2
                    ? "兑换券"
                    : orderDetail.payChannel || "-"
              }}
            </el-descriptions-item>
            <el-descriptions-item label="收货人">
              {{ orderDetail.receiverName }} {{ orderDetail.receiverPhone }}
            </el-descriptions-item>
            <el-descriptions-item label="地址" :span="2">{{ orderDetail.receiverAddress }}</el-descriptions-item>
            <el-descriptions-item v-if="orderDetail.expressNo" label="物流" :span="2">
              {{ orderDetail.expressCompanyName || orderDetail.expressCompany }} {{ orderDetail.expressNo }}
            </el-descriptions-item>
            <el-descriptions-item v-if="orderDetail.buyerRemark" label="备注" :span="2">
              {{ orderDetail.buyerRemark }}
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ formatTime(orderDetail.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ formatTime(orderDetail.finishTime) || "-" }}</el-descriptions-item>
          </el-descriptions>
          <el-table :data="orderDetail.items || []" border style="margin-top: 16px">
            <el-table-column prop="productName" label="商品" min-width="180">
              <template #default="{ row }">
                <el-tag v-if="row.itemType === 2" size="small" type="warning" style="margin-right: 6px">礼盒套装</el-tag>
                {{ row.productName }}
              </template>
            </el-table-column>
            <el-table-column prop="specName" label="规格" width="80" />
            <el-table-column prop="price" label="单价" width="90" />
            <el-table-column label="数量" width="90">
              <template #default="{ row }">
                {{ row.quantity }}{{ row.itemType === 2 ? " 盒" : "" }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="小计" width="90" />
          </el-table>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchOrderReviewList, type AdminOrderReviewVO } from "@/api/orderReview";
import { fetchAdminOrderDetail, type AdminOrderVO } from "@/api/order";

const orderNo = ref("");
const memberId = ref("");
const rating = ref<number | undefined>();
const timeRange = ref<[string, string] | null>(null);
const list = ref<AdminOrderReviewVO[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const orderVisible = ref(false);
const orderLoading = ref(false);
const orderDetail = ref<AdminOrderVO | null>(null);

function formatTime(t?: string) {
  if (!t) {
    return "";
  }
  return String(t).replace("T", " ").slice(0, 19);
}

async function load() {
  loading.value = true;
  try {
    const mid = memberId.value.trim();
    const { data } = await fetchOrderReviewList({
      orderNo: orderNo.value.trim() || undefined,
      memberId: mid ? Number(mid) : undefined,
      rating: rating.value,
      beginTime: timeRange.value?.[0],
      endTime: timeRange.value?.[1],
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    list.value = data.data?.records || [];
    total.value = data.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNum.value = 1;
  load();
}

async function openOrder(row: AdminOrderReviewVO) {
  if (!row.orderId) {
    ElMessage.warning("订单不存在");
    return;
  }
  orderVisible.value = true;
  orderLoading.value = true;
  orderDetail.value = null;
  try {
    const { data } = await fetchAdminOrderDetail(row.orderId);
    orderDetail.value = data.data || null;
  } catch (e: any) {
    orderVisible.value = false;
    ElMessage.error(e?.message || "加载订单失败");
  } finally {
    orderLoading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.stars {
  color: #f59e0b;
  letter-spacing: 1px;
}
.imgs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}
</style>
