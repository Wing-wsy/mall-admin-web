<template>
  <el-dialog
    :model-value="modelValue"
    title="商品详情"
    width="780px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="名称" :span="2">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="副标题" :span="2">{{ detail.subtitle || "-" }}</el-descriptions-item>
        <el-descriptions-item label="商品分类">{{ detail.categoryPath || "-" }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.status === 1 ? 'success' : 'info'" size="small">
            {{ detail.status === 1 ? "上架" : "下架" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="现价">¥{{ detail.price }}</el-descriptions-item>
        <el-descriptions-item label="原价">{{ detail.originPrice != null ? `¥${detail.originPrice}` : "-" }}</el-descriptions-item>
        <el-descriptions-item label="库存">{{ detail.stockSummary || detail.stock || 0 }}</el-descriptions-item>
        <el-descriptions-item label="节日分类">
          {{ detail.festivalPaths?.length ? detail.festivalPaths.join("；") : "无" }}
        </el-descriptions-item>
      </el-descriptions>
      <div class="detail-title">售卖规格</div>
      <el-table :data="detail.skus || []" border size="small">
        <el-table-column prop="specName" label="规格" min-width="100">
          <template #default="{ row }">{{ row.specName || "-" }}</template>
        </el-table-column>
        <el-table-column label="现价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
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
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { fetchProductDetail, type ProductVO } from "@/api/product";

const props = defineProps<{
  modelValue: boolean;
  productId?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const detail = ref<ProductVO | null>(null);

watch(
  [() => props.modelValue, () => props.productId],
  async ([visible, id]) => {
    if (!visible || !id) {
      detail.value = null;
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
</style>
