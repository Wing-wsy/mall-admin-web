<template>
  <div>
    <div class="toolbar">
      <el-radio-group v-model="unreadOnly" @change="search">
        <el-radio-button :value="false">全部</el-radio-button>
        <el-radio-button :value="true">未读</el-radio-button>
      </el-radio-group>
      <el-button type="primary" :disabled="!unreadCount" @click="onReadAll">全部已读</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe @row-click="onRowClick">
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.read ? 'info' : 'danger'" size="small">
            {{ row.read ? "已读" : "未读" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="bizTypeLabel" label="类型" width="100" />
      <el-table-column prop="title" label="标题" min-width="220" />
      <el-table-column prop="content" label="内容" min-width="260" show-overflow-tooltip />
      <el-table-column prop="createTime" label="时间" width="170" />
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="load"
        @size-change="search"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  fetchInboxList,
  fetchInboxUnreadCount,
  markInboxAllRead,
  markInboxRead,
  type AdminMessage,
} from "@/api/inbox";

const router = useRouter();
const loading = ref(false);
const list = ref<AdminMessage[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const unreadOnly = ref(false);
const unreadCount = ref(0);

async function refreshUnread() {
  try {
    const { data } = await fetchInboxUnreadCount();
    unreadCount.value = data?.data?.count ?? 0;
  } catch {
    unreadCount.value = 0;
  }
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchInboxList({
      unreadOnly: unreadOnly.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    list.value = data?.data?.records || [];
    total.value = data?.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNum.value = 1;
  load();
  refreshUnread();
}

async function onRowClick(row: AdminMessage) {
  if (!row.read) {
    try {
      await markInboxRead(row.id);
      row.read = true;
      await refreshUnread();
    } catch {
      // ignore
    }
  }
  if (row.linkPath) {
    router.push(row.linkPath);
  }
}

async function onReadAll() {
  await markInboxAllRead();
  ElMessage.success("已全部标记为已读");
  await load();
  await refreshUnread();
}

onMounted(async () => {
  await refreshUnread();
  await load();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
:deep(.el-table__row) {
  cursor: pointer;
}
</style>
