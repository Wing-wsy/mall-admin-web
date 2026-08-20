<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane label="客服配置" name="contact" />
      <el-tab-pane label="运费" name="freight" />
    </el-tabs>

    <el-card v-show="tab === 'contact'" v-loading="contactLoading" class="card">
      <p class="hint">客服信息展示在小程序「我的 - 联系客服」；公告展示在首页搜索栏下方小喇叭。均可留空。</p>
      <el-form label-width="96px" style="max-width: 560px">
        <el-form-item label="客服电话">
          <el-input v-model="contact.csPhone" maxlength="32" placeholder="如 400-800-1234" />
        </el-form-item>
        <el-form-item label="客服邮箱">
          <el-input v-model="contact.csEmail" maxlength="128" placeholder="如 service@example.com" />
        </el-form-item>
        <el-form-item label="首页公告">
          <el-input
            v-model="contact.notice"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="展示在首页搜索栏下方，留空则不显示"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="contactSaving" @click="saveContact">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-show="tab === 'freight'" v-loading="freightLoading" class="card freight-card">
      <p class="hint">
        按件计费：订单内全部商品数量合计后套用「首件 + 续件」。指定省份覆盖默认运费。会员折与优惠券只减商品，运费不打折。停用后现金单运费为 0。
      </p>
      <el-form label-width="108px">
        <el-form-item label="启用运费">
          <el-switch v-model="freight.enabled" />
        </el-form-item>
        <el-form-item label="满额包邮">
          <el-input-number
            v-model="freight.freeThreshold"
            class="num-fee"
            controls-position="right"
            :min="0"
            :step="1"
            :precision="2"
            :value-on-clear="null"
            placeholder="不填则不包邮"
          />
          <span class="tip">按折后商品金额判断，0 或不填表示不包邮</span>
        </el-form-item>

        <el-form-item label="默认运费" required>
          <div class="rule-row">
            <span>首</span>
            <el-input-number v-model="freight.defaultRule.firstQty" class="num-qty" controls-position="right" :min="1" :step="1" :precision="0" />
            <span>件</span>
            <el-input-number v-model="freight.defaultRule.firstFee" class="num-fee" controls-position="right" :min="0" :step="1" :precision="2" />
            <span>元，每续</span>
            <el-input-number v-model="freight.defaultRule.extraQty" class="num-qty" controls-position="right" :min="1" :step="1" :precision="0" />
            <span>件</span>
            <el-input-number v-model="freight.defaultRule.extraFee" class="num-fee" controls-position="right" :min="0" :step="1" :precision="2" />
            <span>元</span>
          </div>
        </el-form-item>

        <el-form-item label="指定省份">
          <div class="region-list">
            <div v-for="(row, index) in freight.regionRules" :key="index" class="region-item">
              <el-select
                v-model="row.provinces"
                multiple
                filterable
                placeholder="选择省份"
                class="province-select"
              >
                <el-option
                  v-for="name in provinceOptions"
                  :key="name"
                  :label="name"
                  :value="name"
                  :disabled="provinceTaken(name, index)"
                />
              </el-select>
              <div class="region-meta">
                <div class="rule-row">
                  <span>首</span>
                  <el-input-number v-model="row.firstQty" class="num-qty" controls-position="right" :min="1" :step="1" :precision="0" />
                  <span>件</span>
                  <el-input-number v-model="row.firstFee" class="num-fee" controls-position="right" :min="0" :step="1" :precision="2" />
                  <span>元，续</span>
                  <el-input-number v-model="row.extraQty" class="num-qty" controls-position="right" :min="1" :step="1" :precision="0" />
                  <span>件</span>
                  <el-input-number v-model="row.extraFee" class="num-fee" controls-position="right" :min="0" :step="1" :precision="2" />
                  <span>元</span>
                </div>
                <el-button link type="danger" @click="removeRegion(index)">删除</el-button>
              </div>
            </div>
            <el-button @click="addRegion">添加省份规则</el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="freightSaving" @click="saveFreight">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchFreightTemplate,
  fetchShopConfig,
  saveFreightTemplate,
  saveShopConfig,
  type FreightRuleVO,
} from "@/api/shop";

const tab = ref("contact");
const contactLoading = ref(false);
const contactSaving = ref(false);
const freightLoading = ref(false);
const freightSaving = ref(false);
const provinceOptions = ref<string[]>([]);

const contact = reactive({
  csPhone: "",
  csEmail: "",
  notice: "",
});

function emptyRule(): FreightRuleVO {
  return { provinces: [], firstQty: 1, firstFee: 0, extraQty: 1, extraFee: 0 };
}

const freight = reactive({
  enabled: false,
  freeThreshold: null as number | null,
  defaultRule: emptyRule(),
  regionRules: [] as FreightRuleVO[],
});

function provinceTaken(name: string, currentIndex: number) {
  return freight.regionRules.some((row, index) => index !== currentIndex && row.provinces.includes(name));
}

function addRegion() {
  freight.regionRules.push(emptyRule());
}

function removeRegion(index: number) {
  freight.regionRules.splice(index, 1);
}

async function loadContact() {
  contactLoading.value = true;
  try {
    const { data } = await fetchShopConfig();
    contact.csPhone = data.data?.csPhone || "";
    contact.csEmail = data.data?.csEmail || "";
    contact.notice = data.data?.notice || "";
  } finally {
    contactLoading.value = false;
  }
}

async function saveContact() {
  contactSaving.value = true;
  try {
    const { data } = await saveShopConfig({
      csPhone: contact.csPhone.trim(),
      csEmail: contact.csEmail.trim(),
      notice: contact.notice.trim(),
    });
    contact.csPhone = data.data?.csPhone || "";
    contact.csEmail = data.data?.csEmail || "";
    contact.notice = data.data?.notice || "";
    ElMessage.success("已保存");
  } catch {
    // interceptor already toasted
  } finally {
    contactSaving.value = false;
  }
}

function applyFreight(vo?: {
  enabled?: boolean;
  freeThreshold?: number | null;
  defaultRule?: FreightRuleVO;
  regionRules?: FreightRuleVO[];
  provinceOptions?: string[];
}) {
  freight.enabled = !!vo?.enabled;
  freight.freeThreshold = vo?.freeThreshold == null ? null : Number(vo.freeThreshold);
  freight.defaultRule = {
    ...emptyRule(),
    ...(vo?.defaultRule || {}),
    provinces: [],
  };
  freight.regionRules = (vo?.regionRules || []).map((row) => ({
    provinces: [...(row.provinces || [])],
    firstQty: row.firstQty ?? 1,
    firstFee: Number(row.firstFee || 0),
    extraQty: row.extraQty ?? 1,
    extraFee: Number(row.extraFee || 0),
  }));
  provinceOptions.value = vo?.provinceOptions || [];
}

async function loadFreight() {
  freightLoading.value = true;
  try {
    const { data } = await fetchFreightTemplate();
    applyFreight(data.data);
  } finally {
    freightLoading.value = false;
  }
}

async function saveFreight() {
  freightSaving.value = true;
  try {
    const threshold = freight.freeThreshold;
    const { data } = await saveFreightTemplate({
      enabled: freight.enabled,
      freeThreshold: threshold == null || threshold === 0 ? null : threshold,
      defaultRule: {
        provinces: [],
        firstQty: freight.defaultRule.firstQty,
        firstFee: freight.defaultRule.firstFee,
        extraQty: freight.defaultRule.extraQty,
        extraFee: freight.defaultRule.extraFee,
      },
      regionRules: freight.regionRules.map((row) => ({
        provinces: row.provinces,
        firstQty: row.firstQty,
        firstFee: row.firstFee,
        extraQty: row.extraQty,
        extraFee: row.extraFee,
      })),
    });
    applyFreight(data.data);
    ElMessage.success("已保存");
  } catch {
    // interceptor already toasted
  } finally {
    freightSaving.value = false;
  }
}

onMounted(() => {
  loadContact();
  loadFreight();
});
</script>

<style scoped>
.card {
  max-width: 960px;
}
.hint {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}
.tip {
  margin-left: 12px;
  color: #9ca3af;
  font-size: 13px;
}
.rule-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.num-qty {
  width: 110px;
}
.num-fee {
  width: 140px;
}
.num-qty :deep(.el-input__inner),
.num-fee :deep(.el-input__inner) {
  text-align: left;
  padding-right: 36px;
}
.region-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.region-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}
.province-select {
  width: 100%;
}
.province-select :deep(.el-select__selection) {
  flex-wrap: wrap;
}
.region-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
