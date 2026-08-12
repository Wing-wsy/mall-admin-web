<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建皮肤</el-button>
      <el-button @click="load">刷新</el-button>
      <span class="hint">有效期继承绑定的节日一级分类；多皮肤重叠按优先级取最高</span>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="编码" width="120" />
      <el-table-column prop="name" label="名称" width="120" />
      <el-table-column prop="festivalPath" label="绑定节日" width="120" />
      <el-table-column prop="priority" label="优先级" width="90" />
      <el-table-column label="有效期(继承)" min-width="200">
        <template #default="{ row }">
          <div>{{ formatTime(row.startTime) }} ~</div>
          <div>{{ formatTime(row.endTime) }}</div>
          <el-tag size="small" :type="row.activeWindow ? 'success' : 'info'" style="margin-top: 4px">
            {{ row.activeWindow ? "进行中" : "未生效" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? "启用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? "停用" : "启用" }}</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑皮肤' : '新建皮肤'" width="720px" top="5vh">
      <el-form label-width="110px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="!!form.id" placeholder="如 zhongqiu" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="节日一级" required>
          <el-select v-model="form.festivalCategoryId" filterable placeholder="选择节日一级分类" style="width: 100%">
            <el-option
              v-for="f in festivalRoots"
              :key="f.id"
              :label="f.name"
              :value="f.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" />
          <span class="tip">越大越优先</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-divider content-position="left">配色</el-divider>
        <el-form-item label="主色">
          <el-color-picker v-model="form.tokens.primary" />
          <el-input v-model="form.tokens.primary" style="width: 140px; margin-left: 8px" />
        </el-form-item>
        <el-form-item label="浅主色">
          <el-color-picker v-model="form.tokens.primarySoft" />
          <el-input v-model="form.tokens.primarySoft" style="width: 140px; margin-left: 8px" />
        </el-form-item>
        <el-form-item label="价格色">
          <el-color-picker v-model="form.tokens.price" />
          <el-input v-model="form.tokens.price" style="width: 140px; margin-left: 8px" />
        </el-form-item>
        <el-form-item label="页面底色">
          <el-color-picker v-model="form.tokens.pageBg" />
          <el-input v-model="form.tokens.pageBg" style="width: 140px; margin-left: 8px" />
        </el-form-item>
        <el-form-item label="品牌色">
          <el-color-picker v-model="form.tokens.brand" />
          <el-input v-model="form.tokens.brand" style="width: 140px; margin-left: 8px" />
        </el-form-item>
        <el-divider content-position="left">文案</el-divider>
        <el-form-item label="品牌名">
          <el-input v-model="form.copy.brandName" />
        </el-form-item>
        <el-form-item label="导航标题">
          <el-input v-model="form.copy.navTitle" />
        </el-form-item>
        <el-form-item label="搜索占位">
          <el-input v-model="form.copy.searchPlaceholder" />
        </el-form-item>
        <el-form-item label="主视觉标签">
          <el-input v-model="form.copy.heroTag" />
        </el-form-item>
        <el-form-item label="主视觉标题">
          <el-input v-model="form.copy.heroTitle" />
        </el-form-item>
        <el-form-item label="主视觉副文">
          <el-input v-model="form.copy.heroSub" />
        </el-form-item>
        <el-divider content-position="left">主视觉图</el-divider>
        <el-form-item label="主视觉">
          <div class="upload-row">
            <el-upload :show-file-list="false" :http-request="onUploadHero" accept="image/*">
              <el-button>上传图片</el-button>
            </el-upload>
            <el-input v-model="form.assets.heroImageUrl" placeholder="图片 URL" style="flex: 1" />
            <el-image
              v-if="form.assets.heroImageUrl"
              :src="form.assets.heroImageUrl"
              style="width: 120px; height: 60px"
              fit="cover"
            />
          </div>
        </el-form-item>
        <el-divider content-position="left">TabBar</el-divider>
        <el-form-item label="选中色">
          <el-color-picker v-model="form.tabbar.selectedColor" />
          <el-input v-model="form.tabbar.selectedColor" style="width: 140px; margin-left: 8px" />
        </el-form-item>
        <el-form-item v-for="(item, idx) in form.tabbar.list" :key="idx" :label="`Tab${idx + 1}`">
          <div class="tab-row">
            <el-input v-model="item.text" placeholder="文案" style="width: 90px" />
            <el-input v-model="item.iconPath" placeholder="默认图标 URL" style="flex: 1" />
            <el-input v-model="item.selectedIconPath" placeholder="选中图标 URL" style="flex: 1" />
            <el-upload :show-file-list="false" :http-request="(o: UploadRequestOptions) => onUploadTab(o, idx, false)" accept="image/*">
              <el-button size="small">默认</el-button>
            </el-upload>
            <el-upload :show-file-list="false" :http-request="(o: UploadRequestOptions) => onUploadTab(o, idx, true)" accept="image/*">
              <el-button size="small">选中</el-button>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import { CATEGORY_TYPE_FESTIVAL, fetchCategoryTree, type CategoryTreeVO } from "@/api/category";
import { uploadAdminFile } from "@/api/product";
import {
  createTheme,
  deleteTheme,
  fetchThemeList,
  updateTheme,
  updateThemeStatus,
  type ThemeVO,
} from "@/api/theme";

type TabItem = { index: number; text: string; iconPath: string; selectedIconPath: string };

const list = ref<ThemeVO[]>([]);
const festivalRoots = ref<CategoryTreeVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);

function defaultTokens() {
  return {
    primary: "#FF5A3D",
    primarySoft: "#FFE8E2",
    price: "#FF5A3D",
    pageBg: "#F7F7F7",
    navText: "#111827",
    brand: "#FF5A3D",
  };
}

function defaultCopy() {
  return {
    brandName: "Mall",
    navTitle: "Mall精选",
    searchPlaceholder: "搜索商品、品牌",
    heroTag: "今日精选",
    heroTitle: "品质好物 用心挑选",
    heroSub: "点击查看商品详情",
  };
}

function defaultTabbar() {
  return {
    color: "#B0B0B0",
    selectedColor: "#FF5A3D",
    list: [
      { index: 0, text: "首页", iconPath: "", selectedIconPath: "" },
      { index: 1, text: "分类", iconPath: "", selectedIconPath: "" },
      { index: 2, text: "购物车", iconPath: "", selectedIconPath: "" },
      { index: 3, text: "我的", iconPath: "", selectedIconPath: "" },
    ] as TabItem[],
  };
}

const form = reactive({
  id: 0,
  code: "",
  name: "",
  festivalCategoryId: undefined as number | undefined,
  priority: 0,
  status: 1,
  tokens: defaultTokens(),
  copy: defaultCopy(),
  assets: { heroImageUrl: "", pageBgImageUrl: "" },
  tabbar: defaultTabbar(),
});

function formatTime(v?: string) {
  return v || "-";
}

function str(map: Record<string, unknown> | undefined, key: string, fallback = "") {
  const v = map?.[key];
  return typeof v === "string" ? v : fallback;
}

async function loadFestivals() {
  const { data } = await fetchCategoryTree(CATEGORY_TYPE_FESTIVAL);
  festivalRoots.value = (data.data || []).filter((n) => !n.parentId);
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchThemeList();
    list.value = data.data || [];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = 0;
  form.code = "";
  form.name = "";
  form.festivalCategoryId = undefined;
  form.priority = 0;
  form.status = 1;
  Object.assign(form.tokens, defaultTokens());
  Object.assign(form.copy, defaultCopy());
  form.assets.heroImageUrl = "";
  form.assets.pageBgImageUrl = "";
  form.tabbar = defaultTabbar();
}

async function openCreate() {
  resetForm();
  await loadFestivals();
  visible.value = true;
}

async function openEdit(row: ThemeVO) {
  await loadFestivals();
  form.id = row.id;
  form.code = row.code;
  form.name = row.name;
  form.festivalCategoryId = row.festivalCategoryId;
  form.priority = row.priority ?? 0;
  form.status = row.status;
  Object.assign(form.tokens, defaultTokens(), row.tokens || {});
  Object.assign(form.copy, defaultCopy(), row.copy || {});
  form.assets.heroImageUrl = str(row.assets, "heroImageUrl");
  form.assets.pageBgImageUrl = str(row.assets, "pageBgImageUrl");
  const tb = defaultTabbar();
  if (row.tabbar) {
    tb.color = str(row.tabbar, "color", tb.color);
    tb.selectedColor = str(row.tabbar, "selectedColor", tb.selectedColor);
    const listRaw = row.tabbar.list;
    if (Array.isArray(listRaw)) {
      tb.list = listRaw.map((it: any, idx: number) => ({
        index: idx,
        text: String(it?.text || tb.list[idx]?.text || ""),
        iconPath: String(it?.iconPath || ""),
        selectedIconPath: String(it?.selectedIconPath || ""),
      }));
    }
  }
  form.tabbar = tb;
  visible.value = true;
}

async function onUploadHero(options: UploadRequestOptions) {
  const { data } = await uploadAdminFile(options.file as File, "theme");
  form.assets.heroImageUrl = data.data.url;
  ElMessage.success("上传成功");
}

async function onUploadTab(options: UploadRequestOptions, idx: number, selected: boolean) {
  const { data } = await uploadAdminFile(options.file as File, "theme");
  if (selected) form.tabbar.list[idx].selectedIconPath = data.data.url;
  else form.tabbar.list[idx].iconPath = data.data.url;
  ElMessage.success("上传成功");
}

async function save() {
  if (!form.code.trim() || !form.name.trim() || !form.festivalCategoryId) {
    ElMessage.warning("请填写编码、名称并选择节日一级");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      festivalCategoryId: form.festivalCategoryId,
      priority: form.priority,
      status: form.status,
      tokens: { ...form.tokens },
      copy: { ...form.copy },
      assets: { ...form.assets },
      tabbar: {
        color: form.tabbar.color,
        selectedColor: form.tabbar.selectedColor,
        list: form.tabbar.list.map((it, idx) => ({ ...it, index: idx })),
      },
    };
    if (form.id) await updateTheme(form.id, payload);
    else await createTheme(payload);
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: ThemeVO) {
  const next = row.status === 1 ? 0 : 1;
  await updateThemeStatus(row.id, next);
  ElMessage.success(next === 1 ? "已启用" : "已停用");
  await load();
}

async function onDelete(row: ThemeVO) {
  await ElMessageBox.confirm(`确认删除皮肤「${row.name}」？`, "提示", { type: "warning" });
  await deleteTheme(row.id);
  ElMessage.success("已删除");
  await load();
}

onMounted(async () => {
  await Promise.all([load(), loadFestivals()]);
});
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
.tip {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.upload-row,
.tab-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
</style>
