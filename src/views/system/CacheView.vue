<template>
  <div>
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="Admin 与小程序共用 Redis。C 端会话 key（mall:app:session:*）禁止写入与删除。"
      style="margin-bottom: 12px"
    />

    <div class="toolbar">
      <el-button v-if="userStore.hasPermission('system:cache:set')" type="primary" @click="openCreate">
        新建
      </el-button>
      <el-input
        v-model="pattern"
        clearable
        placeholder="匹配模式，默认 mall:*"
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-button-group>
        <el-button @click="quick('mall:*')">mall:*</el-button>
        <el-button @click="quick('mall:wechat:*')">微信 token</el-button>
        <el-button @click="quick('voucher:fail:*')">券限流</el-button>
        <el-button @click="quick('mall:app:session:*')">会话(只读)</el-button>
      </el-button-group>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button
        v-if="userStore.hasPermission('system:cache:delete')"
        type="danger"
        :disabled="!selectedDeletable.length"
        @click="onBatchDelete"
      >
        批量删除
      </el-button>
    </div>

    <el-alert
      v-if="truncated"
      type="info"
      :closable="false"
      title="匹配结果已达扫描上限（2000），仅展示部分 key。请缩小 pattern。"
      style="margin-bottom: 12px"
    />

    <el-table
      :data="list"
      v-loading="loading"
      border
      stripe
      row-key="key"
      @selection-change="onSelectionChange"
    >
      <el-table-column
        v-if="userStore.hasPermission('system:cache:delete')"
        type="selection"
        width="48"
        :selectable="(row: CacheKeyVO) => !row.protectedKey"
      />
      <el-table-column prop="key" label="Key" min-width="280" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="90" />
      <el-table-column label="TTL" width="120">
        <template #default="{ row }">{{ formatTtl(row.ttl) }}</template>
      </el-table-column>
      <el-table-column label="保护" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.protectedKey" type="warning" size="small">会话</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="userStore.hasPermission('system:cache:get')"
            link
            type="primary"
            @click="openDetail(row)"
          >
            查看
          </el-button>
          <el-button
            v-if="userStore.hasPermission('system:cache:set') && !row.protectedKey"
            link
            type="primary"
            @click="openEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="userStore.hasPermission('system:cache:delete') && !row.protectedKey"
            link
            type="danger"
            @click="onDelete(row)"
          >
            删除
          </el-button>
        </template>
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

    <el-dialog v-model="detailVisible" title="缓存详情" width="720px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="Key" :span="2">{{ detail.key }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ detail.type }}</el-descriptions-item>
        <el-descriptions-item label="TTL">{{ formatTtl(detail.ttl) }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.protectedKey" label="保护" :span="2">
          C 端会话，只读
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.remark" label="说明" :span="2">
          {{ detail.remark }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.valueLength != null" label="值长度">
          {{ detail.valueLength }}
          <span v-if="detail.truncated">（已截断预览）</span>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="detail?.value != null" class="payload">
        <div class="payload-title">Value</div>
        <pre>{{ detail.value }}</pre>
      </div>
      <template v-if="detail && !detail.protectedKey && userStore.hasPermission('system:cache:set')" #footer>
        <el-button @click="openTtl(detail.key, detail.ttl)">改 TTL</el-button>
        <el-button type="primary" @click="openEditFromDetail">编辑值</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="formVisible" :title="formMode === 'create' ? '新建缓存' : '编辑缓存'" width="560px">
      <el-form label-width="90px">
        <el-form-item label="Key" required>
          <el-input v-model="form.key" :disabled="formMode === 'edit'" placeholder="例如 mall:demo:foo" />
        </el-form-item>
        <el-form-item label="Value" required>
          <el-input v-model="form.value" type="textarea" :rows="8" placeholder="仅支持 string" />
        </el-form-item>
        <el-form-item label="TTL(秒)">
          <el-input-number v-model="form.ttlSeconds" :min="0" :controls="false" placeholder="0=永不过期" />
          <span class="hint">留空：新建永不过期；编辑则保留原 TTL。填 0 表示永不过期</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="ttlVisible" title="修改过期时间" width="420px">
      <el-form label-width="100px">
        <el-form-item label="Key">
          <el-input :model-value="ttlForm.key" disabled />
        </el-form-item>
        <el-form-item label="TTL(秒)" required>
          <el-input-number v-model="ttlForm.ttlSeconds" :min="0" :controls="false" />
          <span class="hint">0 = 永不过期</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ttlVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTtl">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deleteCacheKeys,
  fetchCacheDetail,
  fetchCacheKeys,
  setCache,
  updateCacheTtl,
  type CacheDetailVO,
  type CacheKeyVO,
} from "@/api/cache";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const list = ref<CacheKeyVO[]>([]);
const total = ref(0);
const truncated = ref(false);
const pageNum = ref(1);
const pageSize = ref(20);
const pattern = ref("mall:*");
const selected = ref<CacheKeyVO[]>([]);

const detailVisible = ref(false);
const detail = ref<CacheDetailVO | null>(null);

const formVisible = ref(false);
const formMode = ref<"create" | "edit">("create");
const form = reactive({
  key: "",
  value: "",
  ttlSeconds: undefined as number | undefined,
});

const ttlVisible = ref(false);
const ttlForm = reactive({
  key: "",
  ttlSeconds: 0,
});

const selectedDeletable = computed(() => selected.value.filter((r) => !r.protectedKey));

function formatTtl(ttl: number | undefined | null) {
  if (ttl == null || ttl === -2) return "-";
  if (ttl === -1) return "永不过期";
  if (ttl < 60) return ttl + "s";
  if (ttl < 3600) return Math.floor(ttl / 60) + "m " + (ttl % 60) + "s";
  return Math.floor(ttl / 3600) + "h " + Math.floor((ttl % 3600) / 60) + "m";
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchCacheKeys({
      pattern: pattern.value.trim() || "mall:*",
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    list.value = data.data?.records || [];
    total.value = data.data?.total || 0;
    truncated.value = !!data.data?.truncated;
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNum.value = 1;
  load();
}

function resetQuery() {
  pattern.value = "mall:*";
  search();
}

function quick(p: string) {
  pattern.value = p;
  search();
}

function onSelectionChange(rows: CacheKeyVO[]) {
  selected.value = rows;
}

function openCreate() {
  formMode.value = "create";
  form.key = "";
  form.value = "";
  form.ttlSeconds = undefined;
  formVisible.value = true;
}

async function openEdit(row: CacheKeyVO) {
  if (row.protectedKey) return;
  formMode.value = "edit";
  form.key = row.key;
  form.value = "";
  form.ttlSeconds = row.ttl != null && row.ttl > 0 ? row.ttl : undefined;
  if (userStore.hasPermission("system:cache:get")) {
    try {
      const { data } = await fetchCacheDetail(row.key);
      form.value = data.data?.value || "";
      if (data.data?.truncated) {
        ElMessage.warning("值已截断，保存将覆盖为截断后的内容，请谨慎");
      }
    } catch {
      /* ignore, allow empty edit */
    }
  }
  formVisible.value = true;
}

async function openEditFromDetail() {
  if (!detail.value || detail.value.protectedKey) return;
  detailVisible.value = false;
  await openEdit({
    key: detail.value.key,
    type: detail.value.type,
    ttl: detail.value.ttl,
    protectedKey: detail.value.protectedKey,
  });
}

async function openDetail(row: CacheKeyVO) {
  const { data } = await fetchCacheDetail(row.key);
  detail.value = data.data || null;
  detailVisible.value = true;
}

function openTtl(key: string, ttl: number) {
  ttlForm.key = key;
  ttlForm.ttlSeconds = ttl > 0 ? ttl : 0;
  ttlVisible.value = true;
}

async function save() {
  const key = form.key.trim();
  if (!key) {
    ElMessage.warning("请填写 Key");
    return;
  }
  if (!form.value) {
    ElMessage.warning("请填写 Value");
    return;
  }
  saving.value = true;
  try {
    const payload: { key: string; value: string; ttlSeconds?: number | null } = {
      key,
      value: form.value,
    };
    if (form.ttlSeconds != null) {
      payload.ttlSeconds = form.ttlSeconds;
    }
    await setCache(payload);
    ElMessage.success("已保存");
    formVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

async function saveTtl() {
  saving.value = true;
  try {
    await updateCacheTtl({ key: ttlForm.key, ttlSeconds: ttlForm.ttlSeconds });
    ElMessage.success("TTL 已更新");
    ttlVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

async function onDelete(row: CacheKeyVO) {
  if (row.protectedKey) return;
  await ElMessageBox.confirm(`确认删除 key？\n${row.key}`, "删除缓存", { type: "warning" });
  await deleteCacheKeys([row.key]);
  ElMessage.success("已删除");
  load();
}

async function onBatchDelete() {
  const keys = selectedDeletable.value.map((r) => r.key);
  if (!keys.length) return;
  await ElMessageBox.confirm(`确认删除选中的 ${keys.length} 个 key？`, "批量删除", { type: "warning" });
  const { data } = await deleteCacheKeys(keys);
  ElMessage.success(`已删除 ${data.data?.deleted ?? keys.length} 个`);
  load();
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.payload {
  margin-top: 16px;
}
.payload-title {
  margin: 8px 0 4px;
  color: #6b7280;
  font-size: 13px;
}
.payload pre {
  margin: 0;
  padding: 8px 12px;
  max-height: 280px;
  overflow: auto;
  background: #f8fafc;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.5;
}
.hint {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
</style>
