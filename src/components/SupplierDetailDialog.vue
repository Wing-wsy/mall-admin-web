<template>
  <el-dialog
    :model-value="modelValue"
    :title="selfOperated ? '自营供应商详情' : '供应商详情'"
    width="560px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="loading" class="muted">加载中...</div>
    <el-descriptions v-else-if="detail" :column="1" border>
      <el-descriptions-item label="供应商">{{ detail.name }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag v-if="selfOperated" type="danger" effect="plain" size="small">自营</el-tag>
        <el-tag v-else :type="statusTagType(detail.status)" size="small">
          {{ detail.statusText || statusLabel(detail.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item v-if="!selfOperated" label="会员手机">{{ detail.phone || "-" }}</el-descriptions-item>
      <el-descriptions-item label="联系方式">{{ detail.contact || "-" }}</el-descriptions-item>
      <el-descriptions-item label="邮箱">{{ detail.email || "-" }}</el-descriptions-item>
      <el-descriptions-item label="地址">{{ detail.address || "-" }}</el-descriptions-item>
      <el-descriptions-item v-if="detail.auditRemark" label="审批说明">{{ detail.auditRemark }}</el-descriptions-item>
      <el-descriptions-item v-if="!selfOperated" label="申请时间">{{ detail.createTime || "-" }}</el-descriptions-item>
    </el-descriptions>
    <div v-else class="muted">暂无供应商信息</div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { fetchSupplierDetail, type AdminSupplierVO } from "@/api/supplier";
import { fetchSelfOperated } from "@/api/shop";

const props = defineProps<{
  modelValue: boolean;
  supplierId?: number | null;
  selfOperated?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const loading = ref(false);
const detail = ref<AdminSupplierVO | null>(null);

function statusLabel(status?: number) {
  if (status === 0) return "待审批";
  if (status === 1) return "已通过";
  if (status === 2) return "已拒绝";
  return "未知";
}

function statusTagType(status?: number) {
  if (status === 1) return "success";
  if (status === 2) return "danger";
  return "warning";
}

watch(
  [() => props.modelValue, () => props.supplierId, () => props.selfOperated],
  async ([visible, id, self]) => {
    if (!visible || (!self && !id)) {
      detail.value = null;
      return;
    }
    loading.value = true;
    try {
      if (self) {
        const { data } = await fetchSelfOperated();
        const vo = data.data;
        detail.value = {
          id: 0,
          memberId: 0,
          name: vo?.name || "自营",
          contact: vo?.contact || "",
          email: vo?.email || "",
          address: vo?.address || "",
          status: 1,
          statusText: "自营",
        };
      } else {
        const { data } = await fetchSupplierDetail(id as number);
        detail.value = data.data;
      }
    } catch (e: any) {
      detail.value = null;
      ElMessage.error(e?.message || (self ? "加载自营档案失败" : "加载供应商失败"));
      emit("update:modelValue", false);
    } finally {
      loading.value = false;
    }
  }
);
</script>

<style scoped>
.muted {
  color: #9ca3af;
  text-align: center;
  padding: 24px 0;
}
</style>
