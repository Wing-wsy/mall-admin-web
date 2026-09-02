<template>
  <div>
    <div class="toolbar">
      <el-input
        v-model="query.username"
        clearable
        placeholder="操作人账号"
        style="width: 150px"
        @keyup.enter="search"
      />
      <el-input
        v-model="query.module"
        clearable
        placeholder="模块"
        style="width: 140px"
        @keyup.enter="search"
      />
      <el-input
        v-model="query.action"
        clearable
        placeholder="操作"
        style="width: 140px"
        @keyup.enter="search"
      />
      <el-select v-model="query.operType" clearable placeholder="类型" style="width: 110px">
        <el-option label="新增" value="CREATE" />
        <el-option label="修改" value="UPDATE" />
        <el-option label="删除" value="DELETE" />
        <el-option label="操作" value="ACTION" />
      </el-select>
      <el-select v-model="query.status" clearable placeholder="结果" style="width: 110px">
        <el-option label="成功" :value="1" />
        <el-option label="失败" :value="0" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
        style="width: 360px"
      />
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="createTime" label="时间" width="170" />
      <el-table-column label="操作人" width="150">
        <template #default="{ row }">{{ row.nickname || row.username || "-" }}</template>
      </el-table-column>
      <el-table-column prop="module" label="模块" width="120" />
      <el-table-column prop="action" label="操作" min-width="140" />
      <el-table-column label="类型" width="80">
        <template #default="{ row }">{{ row.operTypeText || row.operType || "-" }}</template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="130" />
      <el-table-column label="结果" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? "成功" : "失败" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="costMs" label="耗时" width="80">
        <template #default="{ row }">{{ row.costMs != null ? row.costMs + "ms" : "-" }}</template>
      </el-table-column>
      <el-table-column label="详情" width="80" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
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

    <el-dialog v-model="visible" title="操作详情" width="720px">
      <el-descriptions v-if="current" :column="2" border>
        <el-descriptions-item label="时间">{{ current.createTime || "-" }}</el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ current.nickname || current.username || "-" }}
          <span v-if="current.username && current.nickname">（{{ current.username }}）</span>
        </el-descriptions-item>
        <el-descriptions-item label="模块">{{ current.module || "-" }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ current.action || "-" }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ current.operTypeText || current.operType || "-" }}</el-descriptions-item>
        <el-descriptions-item label="方法">{{ current.method || "-" }}</el-descriptions-item>
        <el-descriptions-item label="路径" :span="2">{{ current.requestUri || "-" }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ current.ip || "-" }}</el-descriptions-item>
        <el-descriptions-item label="结果">
          {{ current.status === 1 ? "成功" : "失败" }}
          <span v-if="current.errorMsg">：{{ current.errorMsg }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="current" class="payload">
        <div class="payload-title">入参</div>
        <pre>{{ current.requestParams || "-" }}</pre>
        <div class="payload-title">出参</div>
        <pre>{{ current.responseBody || "-" }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { fetchOperLogList, type OperLogVO } from "@/api/operLog";

const loading = ref(false);
const list = ref<OperLogVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const visible = ref(false);
const current = ref<OperLogVO | null>(null);
const dateRange = ref<[string, string] | undefined>();

const query = reactive({
  username: "",
  module: "",
  action: "",
  operType: undefined as string | undefined,
  status: undefined as number | undefined,
});

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchOperLogList({
      username: query.username.trim() || undefined,
      module: query.module.trim() || undefined,
      action: query.action.trim() || undefined,
      operType: query.operType,
      status: query.status,
      beginTime: dateRange.value?.[0],
      endTime: dateRange.value?.[1],
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
  query.username = "";
  query.module = "";
  query.action = "";
  query.operType = undefined;
  query.status = undefined;
  dateRange.value = undefined;
  search();
}

function openDetail(row: OperLogVO) {
  current.value = row;
  visible.value = true;
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
  max-height: 220px;
  overflow: auto;
  background: #f8fafc;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.5;
}
</style>
