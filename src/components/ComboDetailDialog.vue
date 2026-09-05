<template>
  <el-dialog
    :model-value="modelValue"
    title="套装详情"
    width="860px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="名称" :span="2">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="副标题" :span="2">{{ detail.subtitle || "-" }}</el-descriptions-item>
        <el-descriptions-item label="售价">¥{{ detail.price }}</el-descriptions-item>
        <el-descriptions-item label="划线价">
          {{ detail.originPrice != null ? `¥${detail.originPrice}` : "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="运费件数">{{ detail.freightQty || 1 }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.status === 1 ? 'success' : 'info'" size="small">
            {{ detail.status === 1 ? "上架" : "下架" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="排序">{{ detail.sort ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="组成数">{{ detail.itemCount ?? detail.items?.length ?? 0 }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-title">盒内商品</div>
      <el-table :data="detail.items || []" border size="small">
        <el-table-column label="封面" width="72">
          <template #default="{ row }">
            <el-image
              v-if="row.coverUrl"
              :src="row.coverUrl"
              style="width: 40px; height: 40px"
              fit="cover"
            />
            <span v-else class="muted">无</span>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="180">
          <template #default="{ row }">
            <el-button
              v-if="row.productId"
              link
              type="primary"
              @click="openProduct(row.productId)"
            >
              {{ row.productName }}
            </el-button>
            <span v-else>{{ row.productName || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="SKU" width="140">
          <template #default="{ row }">{{ row.attrText || row.specName || "-" }}</template>
        </el-table-column>
        <el-table-column label="数量" width="80">
          <template #default="{ row }">×{{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="SKU价" width="90">
          <template #default="{ row }">
            {{ row.skuPrice != null ? `¥${row.skuPrice}` : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="库存" width="80">
          <template #default="{ row }">{{ row.stock ?? "-" }}</template>
        </el-table-column>
      </el-table>

      <div class="detail-title">头图</div>
      <div v-if="galleryUrls.length" class="img-list">
        <el-image
          v-for="(url, index) in galleryUrls"
          :key="'cg-' + index"
          :src="url"
          style="width: 80px; height: 80px"
          fit="cover"
          :preview-src-list="galleryUrls"
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
          :key="'cd-' + index"
          :src="url"
          style="width: 80px; height: 80px"
          fit="cover"
          :preview-src-list="detail.detailImageUrls"
          :initial-index="index"
        />
      </div>
      <div v-else class="muted">无</div>
    </template>
    <el-empty v-else-if="!loading" description="套装不存在或已删除" :image-size="72" />
  </el-dialog>
  <ProductDetailDialog v-model="productVisible" :product-id="productId" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { fetchComboDetail, type ComboVO } from "@/api/combo";
import ProductDetailDialog from "@/components/ProductDetailDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  comboId?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const detail = ref<ComboVO | null>(null);
const loading = ref(false);
const productVisible = ref(false);
const productId = ref<number>();

const galleryUrls = computed(() => {
  const urls = detail.value?.galleryUrls?.filter(Boolean) || [];
  if (urls.length) return urls;
  return detail.value?.coverUrl ? [detail.value.coverUrl] : [];
});

function openProduct(id: number) {
  productId.value = id;
  productVisible.value = true;
}

watch(
  [() => props.modelValue, () => props.comboId],
  async ([visible, id]) => {
    if (!visible || !id) {
      detail.value = null;
      productVisible.value = false;
      productId.value = undefined;
      loading.value = false;
      return;
    }
    loading.value = true;
    detail.value = null;
    try {
      const { data } = await fetchComboDetail(id);
      detail.value = data.data || null;
    } catch {
      detail.value = null;
    } finally {
      loading.value = false;
    }
  },
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
