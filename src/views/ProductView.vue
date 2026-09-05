<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增商品</el-button>
      <el-button @click="load">刷新</el-button>
      <el-input
        v-model="query.name"
        clearable
        placeholder="商品名称（模糊）"
        style="width: 180px"
        @keyup.enter="search"
      />
      <el-cascader
        v-model="query.categoryId"
        :options="filterProductTree"
        :props="filterCascaderProps"
        clearable
        filterable
        placeholder="商品分类"
        style="width: 200px"
      />
      <el-cascader
        v-model="query.festivalId"
        :options="filterFestivalTree"
        :props="filterCascaderProps"
        clearable
        filterable
        placeholder="节日分类"
        style="width: 200px"
      />
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 110px">
        <el-option label="上架" :value="1" />
        <el-option label="下架" :value="0" />
        <el-option label="待审批" :value="2" />
        <el-option label="待上架" :value="3" />
        <el-option label="已拒绝" :value="4" />
      </el-select>
      <el-select
        v-if="!userStore.isSupplier"
        v-model="query.supplierId"
        clearable
        placeholder="发货方"
        style="width: 140px"
      >
        <el-option label="自营" :value="0" />
        <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="封面" width="90">
        <template #default="{ row }">
          <el-image
            v-if="row.coverUrl"
            :src="row.coverUrl"
            style="width: 56px; height: 56px"
            fit="cover"
          />
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column prop="categoryPath" label="商品分类" min-width="140" />
      <el-table-column label="属性/单位" min-width="140">
        <template #default="{ row }">
          <span v-if="row.specSummary">{{ row.specSummary }}</span>
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column label="库存" width="110">
        <template #default="{ row }">
          {{ row.stockSummary || row.stock || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="节日分类" min-width="160">
        <template #default="{ row }">
          <span v-if="row.festivalPaths?.length">{{ row.festivalPaths.join("；") }}</span>
          <span v-else class="muted">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="现价" width="100" />
      <el-table-column prop="originPrice" label="原价" width="100" />
      <el-table-column label="发货方" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.selfOperated" type="danger" effect="plain">{{ row.supplierName || "自营" }}</el-tag>
          <span v-else>{{ row.supplierName || "供应商" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="140">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">
            {{ row.statusText || statusLabel(row.status) }}
          </el-tag>
          <div v-if="row.status === 4 && row.auditRemark" class="reject-reason">{{ row.auditRemark }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 1" link @click="toggleStatus(row, 0)">下架</el-button>
          <el-button v-if="row.status === 0 || row.status === 3" link @click="toggleStatus(row, 1)">上架</el-button>
          <el-button
            v-if="row.status === 2 && userStore.hasPermission('product:approve')"
            link
            type="success"
            @click="onApprove(row)"
          >
            通过
          </el-button>
          <el-button
            v-if="row.status === 2 && userStore.hasPermission('product:approve')"
            link
            type="danger"
            @click="onReject(row)"
          >
            拒绝
          </el-button>
          <el-button v-if="row.status === 4 && userStore.isSupplier" link type="warning" @click="onSubmit(row)">
            再次提交
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

    <el-dialog v-model="visible" :title="form.id ? '编辑商品' : '新增商品'" width="1080px" top="3vh">
      <el-form label-width="96px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" />
        </el-form-item>
        <el-form-item label="商品分类" required>
          <el-cascader
            v-model="form.categoryId"
            :options="productTree"
            :props="categoryCascaderProps"
            filterable
            clearable
            placeholder="选择末级分类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="节日分类">
          <el-cascader
            v-model="form.festivalIds"
            :options="festivalTree"
            :props="festivalCascaderProps"
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="可多选末级节日分类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="发货方" required>
          <el-select v-model="form.supplierId" :disabled="userStore.isSupplier && !!form.id" placeholder="选择发货方" style="width: 100%">
            <el-option v-if="!userStore.isSupplier" label="自营" :value="0" />
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="头图">
          <div class="img-list">
            <div v-for="(url, index) in form.galleryUrls" :key="'g-' + index" class="img-item">
              <el-image :src="url" style="width: 80px; height: 80px" fit="cover" />
              <div class="img-actions">
                <el-button link :disabled="index === 0" @click="moveUrl(form.galleryUrls, index, -1)">前移</el-button>
                <el-button link type="danger" @click="form.galleryUrls.splice(index, 1)">删除</el-button>
              </div>
            </div>
            <el-upload
              v-if="form.galleryUrls.length < 9"
              :show-file-list="false"
              :http-request="(opt: UploadRequestOptions) => onUpload(opt, form.galleryUrls, 9)"
              accept="image/*"
            >
              <el-button>上传</el-button>
            </el-upload>
          </div>
          <div class="tip">建议 1:1（1200×1200），最多 9 张；第一张作为列表封面</div>
        </el-form-item>
        <el-form-item label="现价">
          <span v-if="displayPrice != null" class="price-preview">¥{{ displayPrice }}</span>
          <span v-else class="muted">由启用 SKU 自动计算</span>
          <span v-if="displayOriginPrice != null" class="origin-preview">原价 ¥{{ displayOriginPrice }}</span>
        </el-form-item>
        <el-form-item label="库存合计">
          <span class="price-preview">{{ stockSum }}</span>
          <span class="tip">各 SKU 库存之和（库存单位），不可直接编辑</span>
        </el-form-item>
        <el-form-item label="告警库存">
          <el-input-number v-model="form.stockAlertQty" :min="0" :precision="0" />
          <el-button link type="primary" @click="form.stockAlertQty = undefined">清除</el-button>
          <span class="tip">低于该值告警；不填则不告警</span>
        </el-form-item>

        <el-form-item label="销售属性">
          <div class="sku-block">
            <el-select
              v-model="selectedAttrIds"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择销售属性（可不选，则生成默认 SKU）"
              style="width: 100%"
              @change="onAttrIdsChange"
            >
              <el-option
                v-for="attr in saleAttrOptions"
                :key="attr.id"
                :label="attr.name"
                :value="attr.id"
                :disabled="attr.status !== 1 && !selectedAttrIds.includes(attr.id)"
              />
            </el-select>
            <div v-for="attrId in selectedAttrIds" :key="attrId" class="attr-value-row">
              <span class="attr-name">{{ attrNameOf(attrId) }}</span>
              <el-select
                v-model="attrValueMap[attrId]"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                placeholder="选择属性值"
                style="flex: 1"
              >
                <el-option
                  v-for="v in valuesOf(attrId)"
                  :key="v.id"
                  :label="v.valueName"
                  :value="v.id!"
                />
              </el-select>
            </div>
            <el-button type="primary" plain class="add-sku" @click="generateSkus">生成SKU</el-button>
            <div class="tip">选择属性与属性值后点「生成SKU」；已有价格/库存按属性值组合保留。</div>
          </div>
        </el-form-item>

        <el-form-item label="SKU" required>
          <div class="sku-block">
            <el-table :data="form.skus" border size="small">
              <el-table-column label="属性" min-width="140">
                <template #default="{ row }">
                  <span>{{ row.attrText || "默认" }}</span>
                </template>
              </el-table-column>
              <el-table-column label="现价" width="130">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0.01" :precision="2" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column label="原价" width="130">
                <template #default="{ row }">
                  <el-input-number v-model="row.originPrice" :min="0" :precision="2" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column label="库存" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.stock" :min="0" :precision="0" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column label="SKU图" width="150">
                <template #default="{ row }">
                  <div class="sku-cover">
                    <el-image
                      v-if="row.coverUrl"
                      :src="row.coverUrl"
                      style="width: 48px; height: 48px"
                      fit="cover"
                    />
                    <el-upload
                      v-if="!row.coverUrl"
                      :show-file-list="false"
                      :http-request="(opt: UploadRequestOptions) => onUploadSkuCover(opt, row)"
                      accept="image/*"
                    >
                      <el-button link type="primary">上传</el-button>
                    </el-upload>
                    <el-button v-else link type="danger" @click="row.coverUrl = ''">清除</el-button>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="启用" width="70">
                <template #default="{ row }">
                  <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
                </template>
              </el-table-column>
              <el-table-column label="" width="64">
                <template #default="{ $index }">
                  <el-button
                    link
                    type="danger"
                    :disabled="form.skus.length <= 1 && !selectedAttrIds.length"
                    @click="removeSkuRow($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="tip">无销售属性时保留一行默认 SKU；SKU 图可选，小程序切换颜色时可展示对应图片。</div>
          </div>
        </el-form-item>

        <el-form-item label="售卖单位" required>
          <div class="sku-block">
            <el-table :data="form.sellUnits" border size="small">
              <el-table-column label="单位" min-width="120">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.specId"
                    filterable
                    placeholder="选择单位"
                    style="width: 100%"
                    @change="onSellUnitSpecChange($index)"
                  >
                    <el-option
                      v-for="spec in specOptionsForSellUnit($index)"
                      :key="spec.id"
                      :label="spec.name"
                      :value="spec.id"
                      :disabled="spec.status !== 1 && spec.id !== row.specId"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="单位价" width="130">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.price"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    placeholder="可选"
                  />
                </template>
              </el-table-column>
              <el-table-column label="原价" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.originPrice" :min="0" :precision="2" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column label="库存单位" width="90">
                <template #default="{ $index }">
                  <el-radio :model-value="form.sellUnits[$index].isBase" :value="1" @change="setBaseSellUnit($index)">
                    是
                  </el-radio>
                </template>
              </el-table-column>
              <el-table-column label="换算" width="140">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.convertQty"
                    :min="row.isBase === 1 ? 1 : 2"
                    :precision="0"
                    :disabled="row.isBase === 1"
                    controls-position="right"
                  />
                </template>
              </el-table-column>
              <el-table-column label="计费件数" width="130">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.freightQty"
                    :min="1"
                    :precision="0"
                    controls-position="right"
                  />
                </template>
              </el-table-column>
              <el-table-column label="启用" width="70">
                <template #default="{ row }">
                  <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
                </template>
              </el-table-column>
              <el-table-column label="" width="64">
                <template #default="{ $index }">
                  <el-button link type="danger" @click="removeSellUnitRow($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="add-sku" @click="addSellUnitRow">添加单位</el-button>
            <div class="tip">
              必须指定一个库存单位（换算=1）。其它单位填写「1 {{ nonBaseHint }} = N {{ baseUnitName || "库存单位" }}」。
              单位价留空则按下单时按 SKU 价 × 换算；单 SKU 商品可填单位价做包装价。
            </div>
          </div>
        </el-form-item>

        <el-form-item label="详情文案">
          <el-input v-model="form.detailHtml" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="详情图">
          <div class="img-list">
            <div v-for="(url, index) in form.detailImageUrls" :key="'d-' + index" class="img-item">
              <el-image :src="url" style="width: 80px; height: 80px" fit="cover" />
              <div class="img-actions">
                <el-button link :disabled="index === 0" @click="moveUrl(form.detailImageUrls, index, -1)">前移</el-button>
                <el-button link type="danger" @click="form.detailImageUrls.splice(index, 1)">删除</el-button>
              </div>
            </div>
            <el-upload
              v-if="form.detailImageUrls.length < 20"
              :show-file-list="false"
              :http-request="(opt: UploadRequestOptions) => onUpload(opt, form.detailImageUrls, 20)"
              accept="image/*"
            >
              <el-button>上传</el-button>
            </el-upload>
          </div>
          <div class="tip">详情长图，宽 750～1200，最多 20 张</div>
        </el-form-item>
        <el-form-item v-if="!userStore.isSupplier" label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <ProductDetailDialog v-model="detailVisible" :product-id="detailId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProductDetailDialog from "@/components/ProductDetailDialog.vue";
import type { UploadRequestOptions } from "element-plus";
import { useUserStore } from "@/stores/user";
import {
  CATEGORY_TYPE_FESTIVAL,
  CATEGORY_TYPE_PRODUCT,
  fetchCategoryTree,
  type CategoryTreeVO,
} from "@/api/category";
import {
  approveProduct,
  createProduct,
  fetchProductDetail,
  fetchProductList,
  rejectProduct,
  submitProduct,
  updateProduct,
  updateProductStatus,
  uploadAdminFile,
  type ProductVO,
} from "@/api/product";
import { fetchSaleAttrList, type SaleAttrVO } from "@/api/saleAttr";
import { fetchSpecList, type SpecVO } from "@/api/spec";
import { fetchSupplierOptions, type AdminSupplierVO } from "@/api/supplier";

interface SkuRow {
  id?: number;
  attrValueIds: number[];
  attrText: string;
  price: number;
  originPrice?: number;
  stock: number;
  coverUrl?: string;
  status: number;
}

interface SellUnitRow {
  id?: number;
  specId?: number;
  name?: string;
  price?: number | null;
  originPrice?: number | null;
  status: number;
  isBase: number;
  convertQty: number;
  freightQty: number;
}

interface TreeOption {
  value: number;
  label: string;
  disabled?: boolean;
  children?: TreeOption[];
}

const categoryCascaderProps = {
  value: "value",
  label: "label",
  children: "children",
  disabled: "disabled",
  emitPath: false,
} as const;

const filterCascaderProps = {
  value: "value",
  label: "label",
  children: "children",
  emitPath: false,
  checkStrictly: true,
} as const;

const festivalCascaderProps = {
  value: "value",
  label: "label",
  children: "children",
  disabled: "disabled",
  emitPath: false,
  multiple: true,
} as const;

const userStore = useUserStore();
const list = ref<ProductVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const productTree = ref<TreeOption[]>([]);
const festivalTree = ref<TreeOption[]>([]);
const filterProductTree = ref<TreeOption[]>([]);
const filterFestivalTree = ref<TreeOption[]>([]);
const specs = ref<SpecVO[]>([]);
const saleAttrs = ref<SaleAttrVO[]>([]);
const supplierOptions = ref<AdminSupplierVO[]>([]);
const loading = ref(false);
const visible = ref(false);
const detailVisible = ref(false);
const detailId = ref<number>();
const saving = ref(false);

const selectedAttrIds = ref<number[]>([]);
const attrValueMap = reactive<Record<number, number[]>>({});

const query = reactive({
  name: "",
  categoryId: undefined as number | undefined,
  festivalId: undefined as number | undefined,
  status: undefined as number | undefined,
  supplierId: undefined as number | undefined,
});

const form = reactive({
  id: 0,
  name: "",
  subtitle: "",
  coverUrl: "",
  galleryUrls: [] as string[],
  detailHtml: "",
  detailImageUrls: [] as string[],
  status: 1,
  categoryId: undefined as number | undefined,
  festivalIds: [] as number[],
  stockAlertQty: undefined as number | undefined,
  supplierId: 0 as number,
  skus: [] as SkuRow[],
  sellUnits: [] as SellUnitRow[],
});

const saleAttrOptions = computed(() => saleAttrs.value);

const enabledSkus = computed(() => form.skus.filter((row) => row.status === 1 && row.price > 0));

const stockSum = computed(() =>
  form.skus.reduce((sum, row) => sum + (row.status === 1 ? Number(row.stock) || 0 : 0), 0),
);

const baseSellUnit = computed(() => form.sellUnits.find((row) => row.status === 1 && row.isBase === 1));

const baseUnitName = computed(() => {
  const specId = baseSellUnit.value?.specId;
  return specs.value.find((s) => s.id === specId)?.name || baseSellUnit.value?.name || "";
});

const nonBaseHint = computed(() => {
  const row = form.sellUnits.find((s) => s.status === 1 && s.isBase !== 1);
  return specs.value.find((s) => s.id === row?.specId)?.name || row?.name || "箱";
});

const displayPrice = computed(() => {
  if (!enabledSkus.value.length) {
    return undefined;
  }
  return Math.min(...enabledSkus.value.map((row) => Number(row.price)));
});

const displayOriginPrice = computed(() => {
  const minRow = enabledSkus.value.reduce<SkuRow | undefined>((best, row) => {
    if (!best || Number(row.price) < Number(best.price)) {
      return row;
    }
    return best;
  }, undefined);
  return minRow?.originPrice != null ? Number(minRow.originPrice) : undefined;
});

function toSelectTree(nodes: CategoryTreeVO[], parentDisabled = false): TreeOption[] {
  return (nodes || []).map((node) => {
    const disabled = parentDisabled || node.status !== 1;
    const children = toSelectTree(node.children || [], disabled);
    const option: TreeOption = {
      value: node.id,
      label: node.name,
      disabled,
    };
    if (children.length) {
      option.children = children;
    }
    return option;
  });
}

function toFilterTree(nodes: CategoryTreeVO[]): TreeOption[] {
  return (nodes || []).map((node) => {
    const children = toFilterTree(node.children || []);
    const option: TreeOption = {
      value: node.id,
      label: node.name,
    };
    if (children.length) {
      option.children = children;
    }
    return option;
  });
}

async function loadTrees() {
  const [p, f] = await Promise.all([
    fetchCategoryTree(CATEGORY_TYPE_PRODUCT),
    fetchCategoryTree(CATEGORY_TYPE_FESTIVAL),
  ]);
  const productNodes = p.data.data || [];
  const festivalNodes = f.data.data || [];
  productTree.value = toSelectTree(productNodes);
  festivalTree.value = toSelectTree(festivalNodes);
  filterProductTree.value = toFilterTree(productNodes);
  filterFestivalTree.value = toFilterTree(festivalNodes);
  try {
    const s = await fetchSpecList({ pageSize: 500 });
    specs.value = s.data.data?.records || [];
  } catch {
    specs.value = [];
  }
  try {
    const a = await fetchSaleAttrList({ pageSize: 500 });
    saleAttrs.value = a.data.data?.records || [];
  } catch {
    saleAttrs.value = [];
  }
  try {
    const sup = await fetchSupplierOptions();
    supplierOptions.value = sup.data.data || [];
  } catch {
    supplierOptions.value = [];
  }
}

function attrNameOf(attrId: number) {
  return saleAttrs.value.find((a) => a.id === attrId)?.name || `属性${attrId}`;
}

function valuesOf(attrId: number) {
  return (saleAttrs.value.find((a) => a.id === attrId)?.values || []).filter(
    (v) => v.id != null && (v.status == null || v.status === 1),
  );
}

function valueNameOf(valueId: number) {
  for (const attr of saleAttrs.value) {
    const hit = attr.values?.find((v) => v.id === valueId);
    if (hit) return hit.valueName;
  }
  return String(valueId);
}

function skuKey(ids: number[]) {
  return [...ids].sort((a, b) => a - b).join(",");
}

function emptySkuRow(attrValueIds: number[] = [], attrText = "默认"): SkuRow {
  return {
    attrValueIds: [...attrValueIds],
    attrText,
    price: 1,
    originPrice: undefined,
    stock: 0,
    coverUrl: "",
    status: 1,
  };
}

function emptySellUnitRow(specId?: number, isBase = 0): SellUnitRow {
  const name = specs.value.find((s) => s.id === specId)?.name;
  return {
    specId,
    name,
    price: undefined,
    originPrice: undefined,
    status: 1,
    isBase,
    convertQty: isBase === 1 ? 1 : 12,
    freightQty: 1,
  };
}

function onAttrIdsChange(ids: number[]) {
  for (const id of ids) {
    if (!attrValueMap[id]) {
      attrValueMap[id] = [];
    }
  }
  for (const key of Object.keys(attrValueMap)) {
    const n = Number(key);
    if (!ids.includes(n)) {
      delete attrValueMap[n];
    }
  }
  if (!ids.length && !form.skus.length) {
    form.skus = [emptySkuRow()];
  }
}

function cartesian<T>(lists: T[][]): T[][] {
  if (!lists.length) return [[]];
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((prev) => list.map((item) => [...prev, item])),
    [[]],
  );
}

function generateSkus() {
  if (!selectedAttrIds.value.length) {
    const keep = form.skus[0];
    form.skus = [
      {
        ...emptySkuRow(),
        id: keep?.id,
        price: keep?.price ?? 1,
        originPrice: keep?.originPrice,
        stock: keep?.stock ?? 0,
        coverUrl: keep?.coverUrl || "",
        status: keep?.status ?? 1,
      },
    ];
    ElMessage.success("已生成默认 SKU");
    return;
  }
  const valueLists: number[][] = [];
  for (const attrId of selectedAttrIds.value) {
    const ids = (attrValueMap[attrId] || []).filter(Boolean);
    if (!ids.length) {
      ElMessage.warning(`请为「${attrNameOf(attrId)}」选择至少一个属性值`);
      return;
    }
    valueLists.push(ids);
  }
  const combos = cartesian(valueLists);
  const existing = new Map(form.skus.map((row) => [skuKey(row.attrValueIds || []), row]));
  form.skus = combos.map((ids) => {
    const key = skuKey(ids);
    const prev = existing.get(key);
    const attrText = ids.map((id) => valueNameOf(id)).join("/");
    if (prev) {
      return {
        ...prev,
        attrValueIds: [...ids],
        attrText,
      };
    }
    return emptySkuRow(ids, attrText);
  });
  ElMessage.success(`已生成 ${form.skus.length} 个 SKU`);
}

function removeSkuRow(index: number) {
  if (form.skus.length <= 1 && !selectedAttrIds.value.length) {
    return;
  }
  form.skus.splice(index, 1);
  if (!form.skus.length) {
    form.skus = [emptySkuRow()];
  }
}

function setBaseSellUnit(index: number) {
  form.sellUnits.forEach((row, i) => {
    if (i === index) {
      row.isBase = 1;
      row.convertQty = 1;
    } else {
      row.isBase = 0;
      if (!row.convertQty || row.convertQty < 2) {
        row.convertQty = 12;
      }
    }
  });
}

function removeSellUnitRow(index: number) {
  const wasBase = form.sellUnits[index]?.isBase === 1;
  form.sellUnits.splice(index, 1);
  if (wasBase && form.sellUnits.length) {
    const firstEnabled = form.sellUnits.findIndex((row) => row.status === 1);
    setBaseSellUnit(firstEnabled >= 0 ? firstEnabled : 0);
  }
}

function unusedEnabledSpecs(exceptIndex = -1) {
  const used = new Set(
    form.sellUnits
      .filter((_, i) => i !== exceptIndex)
      .map((row) => row.specId)
      .filter((id): id is number => id != null),
  );
  return specs.value.filter((spec) => spec.status === 1 && !used.has(spec.id));
}

function specOptionsForSellUnit(index: number) {
  const currentId = form.sellUnits[index]?.specId;
  const used = new Set(
    form.sellUnits
      .filter((_, i) => i !== index)
      .map((row) => row.specId)
      .filter((id): id is number => id != null),
  );
  return specs.value.filter((spec) => spec.id === currentId || !used.has(spec.id));
}

function onSellUnitSpecChange(index: number) {
  const row = form.sellUnits[index];
  if (!row) return;
  row.name = specs.value.find((s) => s.id === row.specId)?.name || row.name;
}

function addSellUnitRow() {
  const next = unusedEnabledSpecs()[0];
  if (!next) {
    ElMessage.warning("没有可添加的启用售卖单位");
    return;
  }
  form.sellUnits.push(emptySellUnitRow(next.id, 0));
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchProductList({
      name: query.name.trim() || undefined,
      categoryId: query.categoryId,
      festivalId: query.festivalId,
      status: query.status,
      supplierId: query.supplierId,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    list.value = data.data?.records || [];
    total.value = data.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNum.value = 1;
  load();
}

function resetQuery() {
  query.name = "";
  query.categoryId = undefined;
  query.festivalId = undefined;
  query.status = undefined;
  query.supplierId = undefined;
  search();
}

function clearAttrSelection() {
  selectedAttrIds.value = [];
  for (const key of Object.keys(attrValueMap)) {
    delete attrValueMap[Number(key)];
  }
}

function resetForm() {
  form.id = 0;
  form.name = "";
  form.subtitle = "";
  form.coverUrl = "";
  form.galleryUrls = [];
  form.detailHtml = "";
  form.detailImageUrls = [];
  form.status = 1;
  form.categoryId = undefined;
  form.festivalIds = [];
  form.stockAlertQty = undefined;
  form.supplierId = userStore.isSupplier
    ? (supplierOptions.value.length === 1 ? supplierOptions.value[0].id : (undefined as unknown as number))
    : 0;
  clearAttrSelection();
  form.skus = [emptySkuRow()];
  const defaultSpec =
    specs.value.find((s) => s.status === 1 && s.name === "件") ||
    specs.value.find((s) => s.status === 1);
  form.sellUnits = [emptySellUnitRow(defaultSpec?.id, 1)];
}

function openDetail(row: ProductVO) {
  detailId.value = row.id;
  detailVisible.value = true;
}

async function openCreate() {
  await loadTrees();
  resetForm();
  visible.value = true;
}

async function openEdit(row: ProductVO) {
  await loadTrees();
  const { data } = await fetchProductDetail(row.id);
  const detail = data.data || row;
  form.id = detail.id;
  form.name = detail.name;
  form.subtitle = detail.subtitle || "";
  form.coverUrl = detail.coverUrl || "";
  form.galleryUrls = detail.galleryUrls?.length
    ? [...detail.galleryUrls]
    : detail.coverUrl
      ? [detail.coverUrl]
      : [];
  form.detailHtml = detail.detailHtml || "";
  form.detailImageUrls = [...(detail.detailImageUrls || [])];
  form.status = detail.status;
  form.categoryId = detail.categoryId;
  form.festivalIds = [...(detail.festivalIds || [])];
  form.stockAlertQty = detail.stockAlertQty ?? undefined;
  form.supplierId = detail.supplierId ?? 0;

  clearAttrSelection();
  const attrs = detail.attrs || [];
  selectedAttrIds.value = attrs.map((a) => a.attrId);
  for (const a of attrs) {
    attrValueMap[a.attrId] = [...(a.valueIds || a.values?.map((v) => v.id) || [])];
  }

  form.skus = (detail.skus || []).map((sku) => ({
    id: sku.id,
    attrValueIds: [...(sku.attrValueIds || [])],
    attrText: sku.attrText || (sku.attrValueIds?.length ? sku.attrValueIds.map(valueNameOf).join("/") : "默认"),
    price: Number(sku.price),
    originPrice: sku.originPrice != null ? Number(sku.originPrice) : undefined,
    stock: sku.stock ?? 0,
    coverUrl: sku.coverUrl || "",
    status: sku.status ?? 1,
  }));
  if (!form.skus.length) {
    form.skus = [emptySkuRow()];
  }

  const units = detail.sellUnits?.length
    ? detail.sellUnits
    : (detail.skus || [])
        .filter((s) => s.specId != null)
        .map((s) => ({
          id: undefined,
          specId: s.specId,
          name: s.specName,
          price: Number(s.price),
          originPrice: s.originPrice != null ? Number(s.originPrice) : undefined,
          status: s.status ?? 1,
          isBase: s.isBase === 1 ? 1 : 0,
          convertQty: s.convertQty && s.convertQty > 0 ? s.convertQty : s.isBase === 1 ? 1 : 12,
          freightQty: s.freightQty && s.freightQty > 0 ? s.freightQty : 1,
        }));

  form.sellUnits = units.map((u) => ({
    id: u.id,
    specId: u.specId,
    name: u.name || specs.value.find((s) => s.id === u.specId)?.name,
    price: u.price != null ? Number(u.price) : undefined,
    originPrice: u.originPrice != null ? Number(u.originPrice) : undefined,
    status: u.status ?? 1,
    isBase: u.isBase === 1 ? 1 : 0,
    convertQty: u.convertQty && u.convertQty > 0 ? u.convertQty : u.isBase === 1 ? 1 : 12,
    freightQty: u.freightQty && u.freightQty > 0 ? u.freightQty : 1,
  }));
  if (!form.sellUnits.length) {
    const defaultSpec =
      specs.value.find((s) => s.status === 1 && s.name === "件") ||
      specs.value.find((s) => s.status === 1);
    form.sellUnits = [emptySellUnitRow(defaultSpec?.id, 1)];
  } else if (!form.sellUnits.some((s) => s.status === 1 && s.isBase === 1)) {
    const firstEnabled = form.sellUnits.findIndex((s) => s.status === 1);
    setBaseSellUnit(firstEnabled >= 0 ? firstEnabled : 0);
  }
  visible.value = true;
}

function moveUrl(list: string[], index: number, delta: number) {
  const next = index + delta;
  if (next < 0 || next >= list.length) {
    return;
  }
  const current = list[index];
  list[index] = list[next];
  list[next] = current;
}

async function onUpload(options: UploadRequestOptions, list: string[], max: number) {
  if (list.length >= max) {
    ElMessage.warning(`最多上传 ${max} 张`);
    return;
  }
  const { data } = await uploadAdminFile(options.file as File, "product");
  list.push(data.data.url);
  ElMessage.success("上传成功");
}

async function onUploadSkuCover(options: UploadRequestOptions, row: SkuRow) {
  const { data } = await uploadAdminFile(options.file as File, "product");
  row.coverUrl = data.data.url;
  ElMessage.success("上传成功");
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写名称");
    return;
  }
  if (!form.categoryId) {
    ElMessage.warning("请选择商品分类");
    return;
  }
  if (!form.skus.length) {
    ElMessage.warning("请至少保留一个 SKU");
    return;
  }
  if (form.skus.some((row) => !row.price || row.price <= 0)) {
    ElMessage.warning("每个 SKU 都需要填写大于 0 的现价");
    return;
  }
  if (!form.skus.some((row) => row.status === 1)) {
    ElMessage.warning("请至少启用一个 SKU");
    return;
  }
  if (selectedAttrIds.value.length) {
    for (const attrId of selectedAttrIds.value) {
      if (!(attrValueMap[attrId] || []).length) {
        ElMessage.warning(`请为「${attrNameOf(attrId)}」选择属性值，或点「生成SKU」`);
        return;
      }
    }
  }
  const sellUnits = form.sellUnits.filter((row) => row.specId != null);
  if (!sellUnits.length) {
    ElMessage.warning("请至少添加一个售卖单位");
    return;
  }
  const unitSpecIds = sellUnits.map((row) => row.specId);
  if (new Set(unitSpecIds).size !== unitSpecIds.length) {
    ElMessage.warning("同一商品不能重复选择同一售卖单位");
    return;
  }
  if (!sellUnits.some((row) => row.status === 1)) {
    ElMessage.warning("请至少启用一个售卖单位");
    return;
  }
  const enabledUnits = sellUnits.filter((row) => row.status === 1);
  if (enabledUnits.filter((row) => row.isBase === 1).length !== 1) {
    ElMessage.warning("启用单位中必须指定且仅指定一个库存单位");
    return;
  }
  if (enabledUnits.some((row) => row.isBase !== 1 && (!row.convertQty || row.convertQty < 2))) {
    ElMessage.warning("非库存单位换算必须为大于等于 2 的整数");
    return;
  }
  if (form.stockAlertQty != null && form.stockAlertQty < 0) {
    ElMessage.warning("告警库存不能为负数");
    return;
  }
  if (userStore.isSupplier && !form.supplierId) {
    ElMessage.warning("请选择归属供应商");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      subtitle: form.subtitle,
      coverUrl: form.galleryUrls[0] || "",
      galleryUrls: form.galleryUrls,
      detailHtml: form.detailHtml,
      detailImageUrls: form.detailImageUrls,
      status: form.status,
      supplierId: form.supplierId || null,
      categoryId: form.categoryId,
      festivalIds: form.festivalIds,
      stockAlertQty: form.stockAlertQty ?? null,
      attrs: selectedAttrIds.value.map((attrId) => ({
        attrId,
        valueIds: [...(attrValueMap[attrId] || [])],
      })),
      skus: form.skus.map((row, index) => ({
        id: row.id,
        attrValueIds: [...(row.attrValueIds || [])],
        attrText: row.attrText || undefined,
        price: row.price,
        originPrice: row.originPrice,
        stock: row.stock ?? 0,
        coverUrl: row.coverUrl || undefined,
        status: row.status,
        sort: (form.skus.length - index) * 10,
      })),
      sellUnits: sellUnits.map((row, index) => ({
        id: row.id,
        specId: row.specId as number,
        name: row.name || specs.value.find((s) => s.id === row.specId)?.name,
        price: row.price != null && row.price > 0 ? row.price : null,
        originPrice: row.originPrice != null && row.originPrice > 0 ? row.originPrice : null,
        status: row.status,
        sort: (sellUnits.length - index) * 10,
        isBase: row.isBase === 1 ? 1 : 0,
        convertQty: row.isBase === 1 ? 1 : row.convertQty,
        freightQty: row.freightQty && row.freightQty > 0 ? row.freightQty : 1,
      })),
    };
    if (form.id) {
      await updateProduct(form.id, payload);
    } else {
      await createProduct(payload);
    }
    ElMessage.success("已保存");
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: ProductVO, next: number) {
  await updateProductStatus(row.id, next);
  ElMessage.success(next === 1 ? "已上架" : "已下架");
  await load();
}

function statusLabel(status: number) {
  if (status === 1) return "上架";
  if (status === 2) return "待审批";
  if (status === 3) return "待上架";
  if (status === 4) return "已拒绝";
  return "下架";
}

function statusTagType(status: number) {
  if (status === 1) return "success";
  if (status === 2) return "warning";
  if (status === 3) return "primary";
  if (status === 4) return "danger";
  return "info";
}

async function onApprove(row: ProductVO) {
  await approveProduct(row.id);
  ElMessage.success("已通过，待上架");
  await load();
}

async function onReject(row: ProductVO) {
  const { value } = await ElMessageBox.prompt("请填写拒绝原因", "拒绝商品", {
    confirmButtonText: "拒绝",
    inputType: "textarea",
    inputPlaceholder: "必填",
    inputPattern: /\S+/,
    inputErrorMessage: "请填写拒绝原因",
  });
  await rejectProduct(row.id, String(value).trim());
  ElMessage.success("已拒绝");
  await load();
}

async function onSubmit(row: ProductVO) {
  await submitProduct(row.id);
  ElMessage.success("已重新提交审批");
  await load();
}

onMounted(async () => {
  await Promise.all([load(), loadTrees()]);
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
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.img-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}
.img-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.img-actions {
  display: flex;
  gap: 4px;
}
.tip {
  margin-top: 6px;
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.muted {
  color: #9ca3af;
}
.reject-reason {
  margin-top: 6px;
  color: #b91c1c;
  font-size: 12px;
  line-height: 1.4;
}
.price-preview {
  font-weight: 700;
  color: #111827;
}
.origin-preview {
  margin-left: 12px;
  color: #9ca3af;
  text-decoration: line-through;
  font-size: 13px;
}
.sku-block {
  width: 100%;
}
.sku-cover {
  display: flex;
  align-items: center;
  gap: 6px;
}
.add-sku {
  margin-top: 8px;
}
.attr-value-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}
.attr-name {
  min-width: 72px;
  color: #374151;
  font-size: 13px;
}
</style>
