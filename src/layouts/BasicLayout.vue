<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">Mall Admin</div>
      <div class="aside-menu">
        <el-menu
          :default-active="active"
          router
          background-color="#111827"
          text-color="#ffffff"
          active-text-color="#ffffff"
        >
          <el-menu-item v-if="dashboardItem?.path" :index="dashboardItem.path">
            {{ dashboardItem.name }}
          </el-menu-item>
          <el-sub-menu v-for="group in groupMenus" :key="group.code" :index="group.code">
            <template #title>{{ group.name }}</template>
            <el-menu-item
              v-for="child in group.children"
              :key="child.path"
              :index="child.path!"
            >
              {{ child.name }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-for="item in extraItems"
            :key="item.path"
            :index="item.path!"
          >
            {{ item.name }}
          </el-menu-item>
        </el-menu>
      </div>
    </el-aside>
    <el-container class="main-wrap">
      <el-header class="header">
        <div class="tabs" role="tablist">
          <button
            v-for="tab in tabStore.tabs"
            :key="tab.path"
            class="tab"
            :class="{ active: tab.path === active }"
            type="button"
            @click="openTab(tab.path)"
          >
            <span class="tab-title">{{ tab.title }}</span>
            <span
              v-if="tabStore.tabs.length > 1"
              class="tab-close"
              @click.stop="closeTab(tab.path)"
            >×</span>
          </button>
        </div>
        <div class="header-right">
          <el-popover
            v-model:visible="inboxVisible"
            placement="bottom-end"
            :width="360"
            trigger="click"
            :teleported="true"
            @show="onInboxOpen"
          >
            <template #reference>
              <div class="inbox-trigger" role="button" tabindex="0" title="消息">
                <el-badge :value="unreadCount || undefined" :hidden="!unreadCount" :max="99">
                  <el-icon :size="18"><Bell /></el-icon>
                </el-badge>
              </div>
            </template>
            <div class="inbox-panel">
              <div class="inbox-head">
                <span>消息</span>
                <el-button link type="primary" :disabled="!unreadCount" @click="onReadAll">全部已读</el-button>
              </div>
              <div v-loading="inboxLoading" class="inbox-list">
                <div v-if="!inboxItems.length" class="inbox-empty">暂无消息</div>
                <button
                  v-for="item in inboxItems"
                  :key="item.id"
                  type="button"
                  class="inbox-item"
                  :class="{ unread: !item.read }"
                  @click="onInboxClick(item)"
                >
                  <div class="inbox-title">{{ item.title }}</div>
                  <div class="inbox-content">{{ item.content || "-" }}</div>
                  <div class="inbox-time">{{ item.createTime || "" }}</div>
                </button>
              </div>
              <div class="inbox-foot">
                <el-button link type="primary" @click="goMessages">查看全部</el-button>
              </div>
            </div>
          </el-popover>
          <span class="user">{{ userStore.tenantName }} · {{ userStore.nickname || userStore.username }}</span>
          <el-button link type="primary" @click="onLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="active" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Bell } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { fetchAdminMe, logoutAdmin } from "@/api/auth";
import {
  fetchInboxList,
  fetchInboxUnreadCount,
  markInboxAllRead,
  markInboxRead,
  type AdminMessage,
} from "@/api/inbox";
import { buildSidebarMenus } from "@/config/menuGroups";
import { useTabStore } from "@/stores/tabs";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const tabStore = useTabStore();

const sidebarMenus = computed(() => buildSidebarMenus(userStore.menus));
const dashboardItem = computed(() => sidebarMenus.value.find((n) => n.code === "dashboard"));
const groupMenus = computed(() => sidebarMenus.value.filter((n) => n.children?.length));
const extraItems = computed(() =>
  sidebarMenus.value.filter((n) => n.code !== "dashboard" && !n.children?.length && n.path)
);
const active = computed(() => route.path);

const unreadCount = ref(0);
const inboxVisible = ref(false);
const inboxLoading = ref(false);
const inboxItems = ref<AdminMessage[]>([]);
let pollTimer: ReturnType<typeof setInterval> | null = null;
/** 首次拉未读只建基线，不弹窗 */
let inboxBaselineReady = false;
let lastUnreadCount = 0;
let lastNotifiedMessageId: number | null = null;

watch(
  () => route.path,
  () => {
    if (route.path === "/login") return;
    tabStore.add({
      path: route.path,
      title: String(route.meta.title || userStore.findMenuTitle(route.path) || "未命名"),
    });
  },
  { immediate: true }
);

async function notifyLatestUnread() {
  try {
    const { data } = await fetchInboxList({ unreadOnly: true, pageNum: 1, pageSize: 1 });
    const item = data?.data?.records?.[0];
    if (!item || item.id === lastNotifiedMessageId) return;
    lastNotifiedMessageId = item.id;
    ElNotification({
      title: item.title || "新消息",
      message: item.content || "",
      position: "top-right",
      duration: 3000,
    });
  } catch {
    // ignore
  }
}

async function refreshUnread() {
  if (!userStore.token) return;
  try {
    const { data } = await fetchInboxUnreadCount();
    const count = data?.data?.count ?? 0;
    unreadCount.value = count;

    if (!inboxBaselineReady) {
      lastUnreadCount = count;
      inboxBaselineReady = true;
      return;
    }

    const prev = lastUnreadCount;
    lastUnreadCount = count;
    // 未读变多才弹最新一条；不标记已读
    if (count > prev) {
      await notifyLatestUnread();
    }
  } catch {
    // ignore
  }
}

async function onInboxOpen() {
  inboxLoading.value = true;
  try {
    const { data } = await fetchInboxList({ pageNum: 1, pageSize: 8 });
    inboxItems.value = data?.data?.records || [];
    await refreshUnread();
  } finally {
    inboxLoading.value = false;
  }
}

async function onInboxClick(item: AdminMessage) {
  if (!item.read) {
    try {
      await markInboxRead(item.id);
      item.read = true;
      await refreshUnread();
    } catch {
      // ignore
    }
  }
  inboxVisible.value = false;
  if (item.linkPath) {
    router.push(item.linkPath);
  }
}

async function onReadAll() {
  await markInboxAllRead();
  unreadCount.value = 0;
  lastUnreadCount = 0;
  inboxItems.value = inboxItems.value.map((m) => ({ ...m, read: true }));
}

function goMessages() {
  inboxVisible.value = false;
  router.push("/messages");
}

onMounted(async () => {
  if (!userStore.token) return;
  try {
    const { data } = await fetchAdminMe();
    if (data?.data) userStore.login(data.data);
  } catch {
    // keep cached profile
  }
  await refreshUnread();
  pollTimer = setInterval(refreshUnread, 30000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
function openTab(path: string) {
  if (path !== route.path) router.push(path);
}

function closeTab(path: string) {
  const next = tabStore.close(path);
  if (path === route.path && next) router.push(next.path);
}

async function onLogout() {
  try {
    await logoutAdmin();
  } catch {
    // ignore
  }
  tabStore.clear();
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
}
.aside {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #111827;
  color: #fff;
}
.brand {
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 700;
}
.aside-menu {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.aside-menu::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
.aside :deep(.el-menu) {
  border-right: none;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #ffffff;
  --el-menu-hover-text-color: #ffffff;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.16);
  --el-menu-active-color: #ffffff;
}
.aside :deep(.el-menu-item),
.aside :deep(.el-sub-menu__title) {
  color: #ffffff !important;
  font-weight: 600;
}
.aside :deep(.el-menu-item:hover),
.aside :deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.16) !important;
  color: #ffffff !important;
}
.aside :deep(.el-menu-item.is-active) {
  background: #2563eb !important;
  color: #ffffff !important;
}
.aside :deep(.el-sub-menu .el-menu-item) {
  padding-left: 40px !important;
  font-weight: 500;
}
.aside :deep(.el-sub-menu__icon-arrow) {
  color: #9ca3af;
}
.main-wrap {
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar {
  display: none;
}
.tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
}
.tab.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}
.tab-title {
  max-width: 120px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tab-close {
  width: 14px;
  line-height: 1;
  color: #9ca3af;
}
.tab-close:hover {
  color: #111827;
}
.main {
  overflow-y: auto;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user {
  color: #6b7280;
  font-size: 14px;
}
.inbox-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  padding: 4px;
  color: #4b5563;
  cursor: pointer;
  outline: none;
}
.inbox-trigger:hover {
  color: #111827;
}
.inbox-panel {
  margin: -4px;
}
.inbox-head,
.inbox-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 8px;
}
.inbox-list {
  max-height: 360px;
  overflow-y: auto;
}
.inbox-empty {
  padding: 24px 8px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
.inbox-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  border-top: 1px solid #f3f4f6;
  background: #fff;
  padding: 10px 8px;
  cursor: pointer;
}
.inbox-item:hover {
  background: #f9fafb;
}
.inbox-item.unread {
  background: #eff6ff;
}
.inbox-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
.inbox-content {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.inbox-time {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
