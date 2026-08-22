<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建套装</el-button>
      <el-button @click="load">刷新</el-button>
      <el-button v-if="hasActive" @click="onClearActive">取消店铺强制套</el-button>
      <span class="hint">启用某套后，首页金刚区和底栏 Tab 一起换成该套画风；取消后跟随节日皮肤绑定的套装</span>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <el-image
            v-if="row.coverUrl"
            :src="row.coverUrl"
            style="width: 40px; height: 40px"
            fit="contain"
          />
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="code" label="编码" width="120" />
      <el-table-column label="素材" width="80">
        <template #default="{ row }">{{ row.itemCount || 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.active" type="success">当前启用</el-tag>
          <el-tag v-else :type="row.status === 1 ? 'info' : 'info'">
            {{ row.status === 1 ? "可选用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="!row.active" link type="primary" @click="onActivate(row)">启用此套</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑套装' : '新建套装'" width="880px" top="4vh">
      <el-form label-width="88px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="!!form.id" placeholder="如 gold-3d" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="如 金箔立体" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">可选用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div class="section-title">金刚区</div>
      <p class="hint block">与首页导航一致，没有的入口不会出现在这里</p>
      <div v-if="navSlots.length" class="slot-grid">
        <div v-for="slot in navSlots" :key="slot.key" class="slot-card">
          <div class="slot-preview">
            <el-image v-if="form.urls[slot.key]" :src="form.urls[slot.key]" fit="contain" />
            <span v-else class="muted">未上传</span>
          </div>
          <div class="slot-name">{{ slot.label }}</div>
          <div class="slot-key">{{ slot.key }}</div>
          <el-upload :show-file-list="false" :http-request="(o: UploadRequestOptions) => onUpload(o, slot.key)" accept="image/*">
            <el-button size="small">上传</el-button>
          </el-upload>
        </div>
      </div>
      <div v-else class="muted">暂无首页导航，请先在「首页导航」配置入口</div>

      <div class="section-title">底栏 Tab</div>
      <div class="slot-grid tab-grid">
        <div v-for="slot in tabSlots" :key="slot.key" class="slot-card">
          <div class="slot-preview">
            <el-image v-if="form.urls[slot.key]" :src="form.urls[slot.key]" fit="contain" />
            <span v-else class="muted">未上传</span>
          </div>
          <div class="slot-name">{{ slot.label }}</div>
          <div class="slot-key">{{ slot.key }}</div>
          <el-upload :show-file-list="false" :http-request="(o: UploadRequestOptions) => onUpload(o, slot.key)" accept="image/*">
            <el-button size="small">上传</el-button>
          </el-upload>
        </div>
      </div>

      <div v-if="extraSlots.length" class="section-title">其它槽位</div>
      <div v-if="extraSlots.length" class="slot-grid">
        <div v-for="key in extraSlots" :key="key" class="slot-card">
          <div class="slot-preview">
            <el-image v-if="form.urls[key]" :src="form.urls[key]" fit="contain" />
            <span v-else class="muted">未上传</span>
          </div>
          <div class="slot-name">{{ extraLabel(key) }}</div>
          <div class="slot-key">{{ key }}</div>
          <el-upload :show-file-list="false" :http-request="(o: UploadRequestOptions) => onUpload(o, key)" accept="image/*">
            <el-button size="small">上传</el-button>
          </el-upload>
        </div>
      </div>

      <div class="add-row">
        <el-input v-model="customKey" placeholder="自定义槽位，如 hairy_crab" style="width: 240px" />
        <el-button @click="addCustomKey">添加槽位</el-button>
        <span class="hint">建议 160×160 PNG 透明底；Tab 81×81</span>
      </div>

      <div class="section-title">预览（当前导航标题 + 本套图标）</div>
      <div class="preview-grid">
        <div v-for="item in previewNav" :key="item.id" class="preview-item">
          <div class="preview-icon">
            <el-image v-if="previewUrl(item)" :src="previewUrl(item)" fit="contain" />
            <span v-else class="muted">空</span>
          </div>
          <span class="preview-name">{{ item.title }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import {
  activateIconSet,
  clearActiveIconSet,
  createIconSet,
  deleteIconSet,
  fetchIconSetList,
  fetchIconSlots,
  updateIconSet,
  type IconSetVO,
  type IconSlotVO,
} from "@/api/iconSet";
import { fetchNavEntryList, type NavEntryVO } from "@/api/navEntry";
import { uploadAdminFile } from "@/api/product";

const list = ref<IconSetVO[]>([]);
const slots = ref<IconSlotVO[]>([]);
const navList = ref<NavEntryVO[]>([]);
const extraKeys = ref<string[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const customKey = ref("");

const form = reactive({
  id: 0,
  code: "",
  name: "",
  coverUrl: "",
  status: 1,
  urls: {} as Record<string, string>,
});

const tabSlots = computed(() => slots.value.filter((s) => s.group === "tab"));
const navSlots = computed(() => {
  const seen = new Set<string>();
  const list: { key: string; label: string }[] = [];
  for (const item of navList.value) {
    const key = (item.iconKey || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push({ key, label: item.title || key });
  }
  return list;
});
const occupiedKeys = computed(() => {
  const keys = new Set(navSlots.value.map((s) => s.key));
  for (const slot of tabSlots.value) keys.add(slot.key);
  return keys;
});
const hasActive = computed(() => list.value.some((s) => s.active));
const extraSlots = computed(() => {
  const extras = new Set(extraKeys.value);
  for (const key of Object.keys(form.urls)) extras.add(key);
  return [...extras].filter((k) => k && !occupiedKeys.value.has(k));
});
const previewNav = computed(() => navList.value.filter((n) => n.status === 1).slice(0, 10));

function extraLabel(key: string) {
  return tabSlots.value.find((s) => s.key === key)?.label || key;
}

function previewUrl(item: NavEntryVO) {
  if (item.iconUrl) return item.iconUrl;
  return (item.iconKey && form.urls[item.iconKey]) || "";
}

async function load() {
  loading.value = true;
  try {
    const [{ data: setRes }, { data: slotRes }] = await Promise.all([
      fetchIconSetList(),
      fetchIconSlots(),
    ]);
    list.value = setRes.data || [];
    slots.value = slotRes.data || [];
    try {
      const { data: navRes } = await fetchNavEntryList();
      navList.value = navRes.data || [];
    } catch {
      navList.value = [];
    }
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = 0;
  form.code = "";
  form.name = "";
  form.coverUrl = "";
  form.status = 1;
  form.urls = {};
  extraKeys.value = [];
  customKey.value = "";
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function openEdit(row: IconSetVO) {
  resetForm();
  form.id = row.id;
  form.code = row.code;
  form.name = row.name;
  form.coverUrl = row.coverUrl || "";
  form.status = row.status;
  const urls: Record<string, string> = {};
  for (const item of row.items || []) {
    if (item.iconKey && item.iconUrl) urls[item.iconKey] = item.iconUrl;
  }
  form.urls = urls;
  visible.value = true;
}

function addCustomKey() {
  const key = customKey.value.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(key)) {
    ElMessage.warning("槽位须为小写字母开头，仅含字母数字和下划线");
    return;
  }
  if (!occupiedKeys.value.has(key) && !extraKeys.value.includes(key)) {
    extraKeys.value = [...extraKeys.value, key];
  }
  customKey.value = "";
}

async function onUpload(options: UploadRequestOptions, key: string) {
  const { data } = await uploadAdminFile(options.file as File, "iconset");
  form.urls = { ...form.urls, [key]: data.data.url };
  if (!form.coverUrl) form.coverUrl = data.data.url;
  ElMessage.success("上传成功");
}

async function save() {
  if (!form.code.trim() || !form.name.trim()) {
    ElMessage.warning("请填写编码和名称");
    return;
  }
  const items = Object.entries(form.urls)
    .filter(([, url]) => !!url)
    .map(([iconKey, iconUrl], sort) => ({ iconKey, iconUrl, sort }));
  saving.value = true;
  try {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      coverUrl: form.coverUrl,
      status: form.status,
      items,
    };
    if (form.id) await updateIconSet(form.id, payload);
    else await createIconSet(payload);
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function onActivate(row: IconSetVO) {
  await ElMessageBox.confirm(`启用「${row.name}」后，小程序下次进入首页即全部换成此套图标。`, "启用套装");
  await activateIconSet(row.id);
  ElMessage.success("已启用");
  await load();
}

async function onClearActive() {
  await ElMessageBox.confirm("取消后不再强制本套，将跟随当前节日皮肤绑定的套装。", "取消店铺强制套");
  await clearActiveIconSet();
  ElMessage.success("已取消");
  await load();
}

async function onDelete(row: IconSetVO) {
  await ElMessageBox.confirm(`确认删除套装「${row.name}」？`, "提示", { type: "warning" });
  await deleteIconSet(row.id);
  ElMessage.success("已删除");
  await load();
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
.hint {
  color: #6b7280;
  font-size: 13px;
}
.hint.block {
  margin: 0 0 10px;
}
.muted {
  color: #9ca3af;
  font-size: 12px;
}
.section-title {
  margin: 16px 0 10px;
  font-weight: 600;
  color: #111827;
}
.slot-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.tab-grid {
  grid-template-columns: repeat(4, 1fr);
}
.slot-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.slot-preview {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
}
.slot-preview :deep(.el-image) {
  width: 56px;
  height: 56px;
}
.slot-name {
  font-size: 13px;
  color: #111827;
}
.slot-key {
  font-size: 11px;
  color: #9ca3af;
}
.add-row {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}
.preview-item {
  width: 18%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.preview-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
}
.preview-icon :deep(.el-image) {
  width: 44px;
  height: 44px;
}
.preview-name {
  font-size: 12px;
  color: #4b5563;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
