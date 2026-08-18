<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane label="券种" name="tpl" />
      <el-tab-pane label="券码" name="code" />
    </el-tabs>

    <div v-show="tab === 'tpl'">
      <div class="toolbar">
        <el-button type="primary" @click="openCreate">新增券种</el-button>
        <el-button @click="loadTemplates">刷新</el-button>
        <span class="hint">验证码生成后仅导出一次明文，用于印刷刮涂层。购卡走普通商品订单，不绑码。</span>
      </div>
      <el-table :data="templates" v-loading="tplLoading" border stripe>
        <el-table-column prop="name" label="券种" min-width="140" />
        <el-table-column label="兑换礼盒" min-width="180">
          <template #default="{ row }">
            {{ row.redeemProductName || "-" }} / {{ row.redeemSkuName || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="码池 / 礼盒库存" width="150">
          <template #default="{ row }">
            <span :class="{ warn: (row.unusedCount || 0) > (row.redeemStock || 0) }">
              未用 {{ row.unusedCount || 0 }} / 库存 {{ row.redeemStock || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="已核销/作废" width="120">
          <template #default="{ row }">{{ row.usedCount || 0 }} / {{ row.voidedCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="有效期" min-width="200">
          <template #default="{ row }">{{ formatRange(row.validStart, row.validEnd) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? "启用" : "停用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? "停用" : "启用" }}</el-button>
            <el-button link type="primary" @click="openGenerate(row)">生成码</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-show="tab === 'code'">
      <div class="toolbar">
        <el-select v-model="codeTemplateId" clearable filterable placeholder="券种" style="width: 180px">
          <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <el-input v-model="batchNo" placeholder="批次号" clearable style="width: 180px" @keyup.enter="loadCodes" />
        <el-input v-model="fullCode" placeholder="完整验证码查询" clearable style="width: 180px" @keyup.enter="loadCodes" />
        <el-input v-model="codeMemberNo" placeholder="用户ID" clearable style="width: 160px" @keyup.enter="loadCodes" />
        <el-select v-model="codeStatus" clearable placeholder="状态" style="width: 120px">
          <el-option :value="0" label="未使用" />
          <el-option :value="1" label="已核销" />
          <el-option :value="2" label="已作废" />
        </el-select>
        <el-button type="primary" @click="loadCodes">查询</el-button>
        <el-button @click="openVoidBatch">按批次作废</el-button>
      </div>
      <el-table :data="codes" v-loading="codeLoading" border stripe>
        <el-table-column prop="codeMask" label="验证码" width="120" />
        <el-table-column prop="templateName" label="券种" min-width="120" />
        <el-table-column prop="batchNo" label="批次" min-width="160" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="codeStatusType(row.status)" size="small">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="memberNo" label="核销用户" min-width="130">
          <template #default="{ row }">{{ row.memberNo || "-" }}</template>
        </el-table-column>
        <el-table-column prop="orderNo" label="核销订单" min-width="160">
          <template #default="{ row }">{{ row.orderNo || "-" }}</template>
        </el-table-column>
        <el-table-column prop="redeemedAt" label="核销时间" min-width="170" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" link type="danger" @click="onVoid(row)">作废</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="tplVisible" :title="form.id ? '编辑券种' : '新增券种'" width="560px">
      <el-form label-width="108px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="兑换礼盒" required>
          <el-select v-model="form.redeemProductId" filterable placeholder="选择商品" style="width: 100%" @change="onProductChange">
            <el-option v-for="p in products" :key="p.id" :label="`${p.name} (#${p.id})`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格" required>
          <el-select v-model="form.redeemSkuId" filterable placeholder="选择规格" style="width: 100%">
            <el-option
              v-for="sku in selectedSkus"
              :key="sku.id"
              :label="`${sku.specName || '规格'} ¥${sku.price}`"
              :value="sku.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="实体卡商品">
          <el-select v-model="form.cardProductId" clearable filterable placeholder="可选，仅运营对照" style="width: 100%">
            <el-option v-for="p in products" :key="p.id" :label="`${p.name} (#${p.id})`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="validRange"
            type="datetimerange"
            start-placeholder="开始"
            end-placeholder="结束"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tplVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="genVisible" title="生成验证码" width="420px">
      <el-alert type="warning" :closable="false" title="明文验证码只在本次导出的 CSV 中出现，请立即交给印刷厂。" />
      <el-form label-width="88px" style="margin-top: 16px">
        <el-form-item label="券种">{{ genRow?.name }}</el-form-item>
        <el-form-item label="数量" required>
          <el-input-number v-model="genCount" :min="1" :max="2000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genVisible = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="submitGenerate">生成并下载</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createVoucherTemplate,
  deleteVoucherTemplate,
  fetchVoucherCodes,
  fetchVoucherTemplates,
  generateVoucherCodes,
  updateVoucherTemplate,
  updateVoucherTemplateStatus,
  voidVoucherBatch,
  voidVoucherCode,
  type AdminVoucherCodeVO,
  type AdminVoucherTemplateVO,
} from "@/api/voucher";
import { fetchProductList, type ProductSkuVO, type ProductVO } from "@/api/product";

const tab = ref("tpl");
const templates = ref<AdminVoucherTemplateVO[]>([]);
const codes = ref<AdminVoucherCodeVO[]>([]);
const products = ref<ProductVO[]>([]);
const tplLoading = ref(false);
const codeLoading = ref(false);
const tplVisible = ref(false);
const saving = ref(false);
const genVisible = ref(false);
const generating = ref(false);
const genRow = ref<AdminVoucherTemplateVO | null>(null);
const genCount = ref(100);
const validRange = ref<[string, string] | null>(null);
const codeTemplateId = ref<number | undefined>();
const batchNo = ref("");
const fullCode = ref("");
const codeMemberNo = ref("");
const codeStatus = ref<number | undefined>();

const form = reactive({
  id: 0,
  name: "",
  redeemProductId: undefined as number | undefined,
  redeemSkuId: undefined as number | undefined,
  cardProductId: undefined as number | undefined,
  status: 1,
});

const selectedSkus = computed<ProductSkuVO[]>(() => {
  const product = products.value.find((p) => p.id === form.redeemProductId);
  return (product?.skus || []).filter((s) => s.id && s.status === 1);
});

watch(tab, (name) => {
  if (name === "code" && !codes.value.length) {
    loadCodes();
  }
});

function codeStatusType(status: number) {
  if (status === 0) return "success";
  if (status === 1) return "primary";
  return "info";
}

function formatRange(start?: string | null, end?: string | null) {
  if (!start && !end) {
    return "不限";
  }
  const a = start ? String(start).replace("T", " ").slice(0, 16) : "不限";
  const b = end ? String(end).replace("T", " ").slice(0, 16) : "不限";
  return `${a} ~ ${b}`;
}

async function loadTemplates() {
  tplLoading.value = true;
  try {
    const [tplRes, productRes] = await Promise.all([fetchVoucherTemplates(), fetchProductList()]);
    templates.value = tplRes.data.data || [];
    products.value = productRes.data.data || [];
  } finally {
    tplLoading.value = false;
  }
}

async function loadCodes() {
  codeLoading.value = true;
  try {
    const { data } = await fetchVoucherCodes({
      templateId: codeTemplateId.value,
      batchNo: batchNo.value || undefined,
      status: codeStatus.value,
      memberNo: codeMemberNo.value || undefined,
      code: fullCode.value || undefined,
    });
    codes.value = data.data || [];
  } finally {
    codeLoading.value = false;
  }
}

function onProductChange() {
  const first = selectedSkus.value[0];
  form.redeemSkuId = first?.id;
}

function resetForm() {
  form.id = 0;
  form.name = "";
  form.redeemProductId = products.value[0]?.id;
  form.redeemSkuId = undefined;
  form.cardProductId = undefined;
  form.status = 1;
  validRange.value = null;
  onProductChange();
}

function openCreate() {
  resetForm();
  tplVisible.value = true;
}

function openEdit(row: AdminVoucherTemplateVO) {
  form.id = row.id;
  form.name = row.name;
  form.redeemProductId = row.redeemProductId;
  form.redeemSkuId = row.redeemSkuId;
  form.cardProductId = row.cardProductId || undefined;
  form.status = row.status;
  validRange.value = row.validStart && row.validEnd ? [row.validStart, row.validEnd] : null;
  tplVisible.value = true;
}

async function saveTemplate() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  if (!form.redeemProductId || !form.redeemSkuId) {
    ElMessage.warning("请选择兑换礼盒和规格");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      redeemProductId: form.redeemProductId,
      redeemSkuId: form.redeemSkuId,
      cardProductId: form.cardProductId || null,
      validStart: validRange.value?.[0] || null,
      validEnd: validRange.value?.[1] || null,
      status: form.status,
    };
    if (form.id) {
      await updateVoucherTemplate(form.id, payload);
    } else {
      await createVoucherTemplate(payload);
    }
    ElMessage.success("已保存");
    tplVisible.value = false;
    await loadTemplates();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: AdminVoucherTemplateVO) {
  const next = row.status === 1 ? 0 : 1;
  await updateVoucherTemplateStatus(row.id, next);
  ElMessage.success(next === 1 ? "已启用" : "已停用");
  await loadTemplates();
}

async function onDelete(row: AdminVoucherTemplateVO) {
  await ElMessageBox.confirm(`删除券种「${row.name}」后列表不再展示，码池记录保留，确认吗？`, "删除券种");
  await deleteVoucherTemplate(row.id);
  ElMessage.success("已删除");
  await loadTemplates();
}

function openGenerate(row: AdminVoucherTemplateVO) {
  genRow.value = row;
  genCount.value = 100;
  genVisible.value = true;
}

async function submitGenerate() {
  if (!genRow.value) {
    return;
  }
  generating.value = true;
  try {
    const { data } = await generateVoucherCodes(genRow.value.id, genCount.value);
    const result = data.data;
    if (result) {
      downloadCsv(result.batchNo, result.codes || []);
      ElMessage.success(`已生成 ${result.count} 个码，请保存 CSV`);
    }
    genVisible.value = false;
    await loadTemplates();
  } finally {
    generating.value = false;
  }
}

function downloadCsv(batch: string, items: { seq: number; code: string }[]) {
  const lines = ["序号,验证码,批次号", ...items.map((c) => `${c.seq},${c.code},${batch}`)];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voucher-${batch}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function onVoid(row: AdminVoucherCodeVO) {
  await ElMessageBox.confirm(`作废验证码 ${row.codeMask} 后不可核销，确认吗？`, "作废券码");
  await voidVoucherCode(row.id);
  ElMessage.success("已作废");
  await loadCodes();
}

async function openVoidBatch() {
  const { value } = await ElMessageBox.prompt("将作废该批次下所有未使用的码", "按批次作废", {
    inputPlaceholder: "请输入批次号",
    inputValue: batchNo.value,
  });
  const no = String(value || "").trim();
  if (!no) {
    return;
  }
  const { data } = await voidVoucherBatch(no);
  ElMessage.success(`已作废 ${data.data || 0} 个未使用码`);
  await loadCodes();
  await loadTemplates();
}

onMounted(loadTemplates);
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.hint {
  color: #9ca3af;
  font-size: 12px;
}
.warn {
  color: #b45309;
}
</style>
