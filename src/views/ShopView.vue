<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane label="客服配置" name="contact" />
      <el-tab-pane label="自营供应商" name="self" />
      <el-tab-pane label="日报推送" name="report" />
      <el-tab-pane label="支付通知" name="paidNotify" />
      <el-tab-pane label="审批通知" name="approvalNotify" />
      <el-tab-pane label="运费" name="freight" />
    </el-tabs>

    <el-card v-show="tab === 'contact'" v-loading="contactLoading" class="card">
      <p class="hint">客服信息展示在小程序「我的 - 联系客服」；公告展示在首页搜索栏下方小喇叭。退货地址用于退货退款，同意后退给用户填写物流。均可留空。</p>
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
        <el-form-item label="兑换券">
          <el-switch v-model="contact.voucherEnabled" />
          <span class="tip">关闭后小程序不展示「礼品兑换」入口，也无法核销；后台仍可管理券种与券码</span>
        </el-form-item>
        <el-form-item label="积分">
          <el-switch v-model="contact.pointsEnabled" />
          <span class="tip">关闭后小程序不展示积分商城/明细与当前积分，也无法兑换；后台仍可管理积分商品</span>
        </el-form-item>
        <el-form-item label="优惠券">
          <el-switch v-model="contact.couponEnabled" />
          <span class="tip">关闭后小程序不展示优惠券入口，下单也不可用券；后台仍可管理券模板</span>
        </el-form-item>
        <el-form-item label="退货联系人">
          <el-input v-model="contact.returnName" maxlength="64" placeholder="退货退款时展示给用户" />
        </el-form-item>
        <el-form-item label="退货电话">
          <el-input v-model="contact.returnPhone" maxlength="32" placeholder="如 400-800-1234" />
        </el-form-item>
        <el-form-item label="退货地址">
          <el-input
            v-model="contact.returnAddress"
            type="textarea"
            :rows="2"
            maxlength="512"
            show-word-limit
            placeholder="省市区 + 详细地址"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="contactSaving" @click="saveContact">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-show="tab === 'self'" v-loading="contactLoading" class="card">
      <p class="hint">
        未绑定供应商的商品视为自营。这里维护展示用档案（名称、联系方式、邮箱、地址），不占用供应商名额，也不是供应商列表里的一条记录。
      </p>
      <el-form label-width="96px" style="max-width: 560px">
        <el-form-item label="名称">
          <el-input v-model="contact.selfName" maxlength="64" placeholder="默认「自营」" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="contact.selfContact" maxlength="32" placeholder="电话或联系人" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="contact.selfEmail" maxlength="64" placeholder="选填" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input
            v-model="contact.selfAddress"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            placeholder="选填"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="selfSaving" @click="saveSelf">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-show="tab === 'report'" v-loading="contactLoading" class="card">
      <p class="hint">
        每天上午 09:00（北京时间）自动推送上一自然日经营数据到下列邮箱；同一租户下各邮箱收到内容相同。需同时配置服务器 SMTP（MAIL_* 环境变量）。
      </p>
      <el-form label-width="108px" style="max-width: 560px">
        <el-form-item label="开启推送">
          <el-switch v-model="contact.dailyReportEnabled" />
        </el-form-item>
        <el-form-item label="收件邮箱" required>
          <el-input
            v-model="contact.dailyReportEmails"
            type="textarea"
            :rows="4"
            maxlength="512"
            show-word-limit
            placeholder="一行一个，或用逗号分隔，最多 10 个"
          />
          <div class="tip">例如：ops@example.com, boss@example.com</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="reportSaving" @click="saveReport">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-show="tab === 'paidNotify'" v-loading="contactLoading" class="card">
      <p class="hint">
        用户下单并支付成功后，立即通知下列邮箱（与「日报推送」收件人相互独立）。积分兑换 / 兑换券核销下单成功也会通知。
      </p>
      <el-form label-width="108px" style="max-width: 560px">
        <el-form-item label="开启通知">
          <el-switch v-model="contact.orderPaidNotifyEnabled" />
        </el-form-item>
        <el-form-item label="收件邮箱" required>
          <el-input
            v-model="contact.orderPaidNotifyEmails"
            type="textarea"
            :rows="4"
            maxlength="512"
            show-word-limit
            placeholder="一行一个，或用逗号分隔，最多 10 个"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="paidNotifySaving" @click="savePaidNotify">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-show="tab === 'approvalNotify'" v-loading="contactLoading" class="card">
      <p class="hint">
        供应商入驻、商品提交审批、用户申请售后进入待审时立即通知；若仍未处理，按下方催办小时再次提醒。收件人与日报 / 支付通知相互独立。
      </p>
      <el-form label-width="108px" style="max-width: 560px">
        <el-form-item label="开启通知">
          <el-switch v-model="contact.approvalNotifyEnabled" />
        </el-form-item>
        <el-form-item label="收件邮箱" required>
          <el-input
            v-model="contact.approvalNotifyEmails"
            type="textarea"
            :rows="4"
            maxlength="512"
            show-word-limit
            placeholder="一行一个，或用逗号分隔，最多 10 个"
          />
        </el-form-item>
        <el-form-item label="催办小时">
          <div class="hours-editor">
            <el-tag
              v-for="(h, index) in approvalHours"
              :key="`${h}-${index}`"
              closable
              class="hour-tag"
              @close="removeHour(index)"
            >
              {{ h }} 小时
            </el-tag>
            <el-input-number
              v-model="hourDraft"
              class="hour-input"
              controls-position="right"
              :min="1"
              :max="168"
              :step="1"
              :precision="0"
            />
            <el-button @click="addHour">添加</el-button>
          </div>
          <div class="tip">自由列表，默认 1 / 3 / 6 小时；留空则只发提交即时通知。最多 10 档，单档不超过 168 小时。</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="approvalNotifySaving" @click="saveApprovalNotify">保存</el-button>
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
const selfSaving = ref(false);
const reportSaving = ref(false);
const paidNotifySaving = ref(false);
const approvalNotifySaving = ref(false);
const freightLoading = ref(false);
const freightSaving = ref(false);
const provinceOptions = ref<string[]>([]);
const approvalHours = ref<number[]>([1, 3, 6]);
const hourDraft = ref<number | null>(24);

const contact = reactive({
  csPhone: "",
  csEmail: "",
  notice: "",
  returnName: "",
  returnPhone: "",
  returnAddress: "",
  selfName: "自营",
  selfContact: "",
  selfEmail: "",
  selfAddress: "",
  voucherEnabled: false,
  pointsEnabled: false,
  couponEnabled: false,
  dailyReportEnabled: false,
  dailyReportEmails: "",
  orderPaidNotifyEnabled: false,
  orderPaidNotifyEmails: "",
  approvalNotifyEnabled: false,
  approvalNotifyEmails: "",
});

function parseHours(raw?: string | null): number[] {
  if (raw == null) return [1, 3, 6];
  if (!raw.trim()) return [];
  const set = new Set<number>();
  for (const part of raw.split(/[,;\s\n\r]+/)) {
    if (!part) continue;
    const n = Number(part);
    if (Number.isInteger(n) && n >= 1 && n <= 168) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

function addHour() {
  const n = hourDraft.value;
  if (n == null || !Number.isInteger(n) || n < 1 || n > 168) {
    ElMessage.warning("请输入 1～168 的整数小时");
    return;
  }
  if (approvalHours.value.includes(n)) {
    ElMessage.warning("该小时已存在");
    return;
  }
  if (approvalHours.value.length >= 10) {
    ElMessage.warning("最多 10 档催办");
    return;
  }
  approvalHours.value = [...approvalHours.value, n].sort((a, b) => a - b);
}

function removeHour(index: number) {
  approvalHours.value.splice(index, 1);
}

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
    contact.returnName = data.data?.returnName || "";
    contact.returnPhone = data.data?.returnPhone || "";
    contact.returnAddress = data.data?.returnAddress || "";
    contact.selfName = data.data?.selfName || "自营";
    contact.selfContact = data.data?.selfContact || "";
    contact.selfEmail = data.data?.selfEmail || "";
    contact.selfAddress = data.data?.selfAddress || "";
    contact.voucherEnabled = !!data.data?.voucherEnabled;
    contact.pointsEnabled = !!data.data?.pointsEnabled;
    contact.couponEnabled = !!data.data?.couponEnabled;
    contact.dailyReportEnabled = !!data.data?.dailyReportEnabled;
    contact.dailyReportEmails = data.data?.dailyReportEmails || "";
    contact.orderPaidNotifyEnabled = !!data.data?.orderPaidNotifyEnabled;
    contact.orderPaidNotifyEmails = data.data?.orderPaidNotifyEmails || "";
    contact.approvalNotifyEnabled = !!data.data?.approvalNotifyEnabled;
    contact.approvalNotifyEmails = data.data?.approvalNotifyEmails || "";
    approvalHours.value = parseHours(data.data?.approvalNotifyHours);
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
      returnName: contact.returnName.trim(),
      returnPhone: contact.returnPhone.trim(),
      returnAddress: contact.returnAddress.trim(),
      voucherEnabled: contact.voucherEnabled,
      pointsEnabled: contact.pointsEnabled,
      couponEnabled: contact.couponEnabled,
    });
    contact.csPhone = data.data?.csPhone || "";
    contact.csEmail = data.data?.csEmail || "";
    contact.notice = data.data?.notice || "";
    contact.returnName = data.data?.returnName || "";
    contact.returnPhone = data.data?.returnPhone || "";
    contact.returnAddress = data.data?.returnAddress || "";
    contact.voucherEnabled = !!data.data?.voucherEnabled;
    contact.pointsEnabled = !!data.data?.pointsEnabled;
    contact.couponEnabled = !!data.data?.couponEnabled;
    ElMessage.success("已保存");
  } catch {
    // interceptor already toasted
  } finally {
    contactSaving.value = false;
  }
}

async function saveSelf() {
  selfSaving.value = true;
  try {
    const { data } = await saveShopConfig({
      selfName: contact.selfName.trim(),
      selfContact: contact.selfContact.trim(),
      selfEmail: contact.selfEmail.trim(),
      selfAddress: contact.selfAddress.trim(),
    });
    contact.selfName = data.data?.selfName || "自营";
    contact.selfContact = data.data?.selfContact || "";
    contact.selfEmail = data.data?.selfEmail || "";
    contact.selfAddress = data.data?.selfAddress || "";
    ElMessage.success("已保存");
  } catch {
    // interceptor already toasted
  } finally {
    selfSaving.value = false;
  }
}

async function saveReport() {
  reportSaving.value = true;
  try {
    const { data } = await saveShopConfig({
      dailyReportEnabled: contact.dailyReportEnabled,
      dailyReportEmails: contact.dailyReportEmails.trim(),
    });
    contact.dailyReportEnabled = !!data.data?.dailyReportEnabled;
    contact.dailyReportEmails = data.data?.dailyReportEmails || "";
    ElMessage.success("已保存");
  } catch {
    // interceptor already toasted
  } finally {
    reportSaving.value = false;
  }
}

async function savePaidNotify() {
  paidNotifySaving.value = true;
  try {
    const { data } = await saveShopConfig({
      orderPaidNotifyEnabled: contact.orderPaidNotifyEnabled,
      orderPaidNotifyEmails: contact.orderPaidNotifyEmails.trim(),
    });
    contact.orderPaidNotifyEnabled = !!data.data?.orderPaidNotifyEnabled;
    contact.orderPaidNotifyEmails = data.data?.orderPaidNotifyEmails || "";
    ElMessage.success("已保存");
  } catch {
    // interceptor already toasted
  } finally {
    paidNotifySaving.value = false;
  }
}

async function saveApprovalNotify() {
  approvalNotifySaving.value = true;
  try {
    const { data } = await saveShopConfig({
      approvalNotifyEnabled: contact.approvalNotifyEnabled,
      approvalNotifyEmails: contact.approvalNotifyEmails.trim(),
      approvalNotifyHours: approvalHours.value.join(","),
    });
    contact.approvalNotifyEnabled = !!data.data?.approvalNotifyEnabled;
    contact.approvalNotifyEmails = data.data?.approvalNotifyEmails || "";
    approvalHours.value = parseHours(data.data?.approvalNotifyHours);
    ElMessage.success("已保存");
  } catch {
    // interceptor already toasted
  } finally {
    approvalNotifySaving.value = false;
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
.hours-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.hour-tag {
  margin: 0;
}
.hour-input {
  width: 120px;
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
