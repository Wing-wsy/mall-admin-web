<template>
  <el-dialog
    :model-value="modelValue"
    title="商品详情"
    width="900px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="名称" :span="2">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="副标题" :span="2">{{ detail.subtitle || "-" }}</el-descriptions-item>
        <el-descriptions-item label="商品分类">{{ detail.categoryPath || "-" }}</el-descriptions-item>
        <el-descriptions-item label="所属供应商">
          <el-button
            v-if="detail.selfOperated || !detail.supplierId"
            link
            type="danger"
            @click="openSelf"
          >
            {{ detail.supplierName || "自营" }}
          </el-button>
          <el-button v-else link type="primary" @click="openSupplier">
            {{ detail.supplierName || "供应商" }}
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(detail.status)" size="small">
            {{ detail.statusText || statusLabel(detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.auditRemark" label="拒绝原因" :span="2">
          {{ detail.auditRemark }}
        </el-descriptions-item>
        <el-descriptions-item label="现价">¥{{ detail.price }}</el-descriptions-item>
        <el-descriptions-item label="原价">{{ detail.originPrice != null ? `¥${detail.originPrice}` : "-" }}</el-descriptions-item>
        <el-descriptions-item label="库存合计">{{ detail.stockSummary || detail.stock || 0 }}</el-descriptions-item>
        <el-descriptions-item label="告警库存">
          {{ detail.stockAlertQty != null ? detail.stockAlertQty : "未设置" }}
        </el-descriptions-item>
        <el-descriptions-item label="节日分类">
          {{ detail.festivalPaths?.length ? detail.festivalPaths.join("；") : "无" }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-title">销售属性</div>
      <template v-if="detail.attrs?.length">
        <div v-for="attr in detail.attrs" :key="attr.attrId" class="attr-line">
          <span class="attr-label">{{ attr.attrName || `属性${attr.attrId}` }}：</span>
          <span>
            {{
              (attr.values || []).map((v) => v.valueName).join("、") ||
              (attr.valueIds || []).join("、") ||
              "-"
            }}
          </span>
        </div>
      </template>
      <div v-else class="muted">无（默认 SKU）</div>

      <div class="detail-title">SKU</div>
      <el-table :data="detail.skus || []" border size="small">
        <el-table-column label="属性" min-width="140">
          <template #default="{ row }">{{ row.attrText || row.specName || "默认" }}</template>
        </el-table-column>
        <el-table-column label="现价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="原价" width="100">
          <template #default="{ row }">{{ row.originPrice != null ? `¥${row.originPrice}` : "-" }}</template>
        </el-table-column>
        <el-table-column label="库存" width="90">
          <template #default="{ row }">{{ row.stock ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="detail-title">售卖单位</div>
      <el-table :data="detail.sellUnits || []" border size="small">
        <el-table-column label="单位" min-width="100">
          <template #default="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="单位价" width="100">
          <template #default="{ row }">
            {{ row.price != null ? `¥${row.price}` : "按SKU换算" }}
          </template>
        </el-table-column>
        <el-table-column label="原价" width="100">
          <template #default="{ row }">{{ row.originPrice != null ? `¥${row.originPrice}` : "-" }}</template>
        </el-table-column>
        <el-table-column label="库存单位" width="90">
          <template #default="{ row }">{{ row.isBase === 1 ? "是" : "-" }}</template>
        </el-table-column>
        <el-table-column label="换算" width="80">
          <template #default="{ row }">{{ row.convertQty || 1 }}</template>
        </el-table-column>
        <el-table-column label="计费件数" width="90">
          <template #default="{ row }">{{ row.freightQty || 1 }}</template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="detail-title">头图</div>
      <div v-if="detail.galleryUrls?.length" class="img-list">
        <el-image
          v-for="(url, index) in detail.galleryUrls"
          :key="'dg-' + index"
          :src="url"
          style="width: 80px; height: 80px"
          fit="cover"
          :preview-src-list="detail.galleryUrls"
          :initial-index="index"
        />
      </div>
      <div v-else class="muted">无</div>
      <div class="detail-title">详情文案</div>
      <div class="detail-html">{{ detail.detailHtml || "无" }}</div>
      <div class="detail-title">详情图</div>
      <div v-if="detail.detailImageUrls?.length" class="img-list">
        <el-image
          v-for="(url, index) in detail.detailImageUrls"
          :key="'dd-' + index"
          :src="url"
          style="width: 80px; height: 80px"
          fit="cover"
          :preview-src-list="detail.detailImageUrls"
          :initial-index="index"
        />
      </div>
      <div v-else class="muted">无</div>
    </template>
  </el-dialog>
  <SupplierDetailDialog v-model="supplierVisible" :supplier-id="supplierId" :self-operated="selfOperated" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { fetchProductDetail, type ProductVO } from "@/api/product";
import SupplierDetailDialog from "@/components/SupplierDetailDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  productId?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const detail = ref<ProductVO | null>(null);
const supplierVisible = ref(false);
const supplierId = ref<number | undefined>();
const selfOperated = ref(false);

function openSupplier() {
  const id = detail.value?.supplierId;
  if (!id) {
    return;
  }
  selfOperated.value = false;
  supplierId.value = id;
  supplierVisible.value = true;
}

function openSelf() {
  selfOperated.value = true;
  supplierId.value = undefined;
  supplierVisible.value = true;
}

function statusLabel(status?: number) {
  if (status === 1) return "上架";
  if (status === 2) return "待审批";
  if (status === 3) return "待上架";
  if (status === 4) return "已拒绝";
  return "下架";
}

function statusTagType(status?: number) {
  if (status === 1) return "success";
  if (status === 2) return "warning";
  if (status === 3) return "primary";
  if (status === 4) return "danger";
  return "info";
}

watch(
  [() => props.modelValue, () => props.productId],
  async ([visible, id]) => {
    if (!visible || !id) {
      detail.value = null;
      supplierVisible.value = false;
      supplierId.value = undefined;
      selfOperated.value = false;
      return;
    }
    try {
      const { data } = await fetchProductDetail(id);
      detail.value = data.data;
    } catch {
      detail.value = null;
      emit("update:modelValue", false);
    }
  }
);
</script>

<style scoped>
.img-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}
.muted {
  color: #9ca3af;
}
.detail-title {
  margin: 16px 0 8px;
  font-weight: 600;
}
.detail-html {
  white-space: pre-wrap;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.6;
}
.attr-line {
  margin-bottom: 6px;
  font-size: 13px;
  color: #374151;
}
.attr-label {
  color: #6b7280;
}
</style>
