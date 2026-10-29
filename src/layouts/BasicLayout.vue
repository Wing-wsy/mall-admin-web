<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">礼尚企服</div>
      <div class="aside-menu">
        <el-menu
          :default-active="active"
          router
        >
          <el-menu-item v-if="dashboardItem?.path" :index="dashboardItem.path">
            <MenuIcon :name="menuIcon(dashboardItem.code)" />
            <span>{{ dashboardItem.name }}</span>
          </el-menu-item>
          <el-sub-menu v-for="group in groupMenus" :key="group.code" :index="group.code">
            <template #title>
              <MenuIcon :name="menuIcon(group.code)" />
              <span>{{ group.name }}</span>
            </template>
            <el-menu-item
              v-for="child in group.children"
              :key="child.path"
              :index="child.path!"
            >
              <MenuIcon :name="menuIcon(child.code)" />
              <span>{{ child.name }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-for="item in extraItems"
            :key="item.path"
            :index="item.path!"
          >
            <MenuIcon :name="menuIcon(item.code)" />
            <span>{{ item.name }}</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-aside>
    <el-container class="main-wrap">
      <el-header class="header">
        <div class="tabs" role="tablist" @click="hideTabMenu">
          <button
            v-for="tab in tabStore.tabs"
            :key="tab.path"
            class="tab"
            :class="{ active: tab.path === active }"
            type="button"
            @click="openTab(tab.path)"
            @contextmenu.prevent="openTabMenu($event, tab.path)"
          >
            <span class="tab-title">{{ tab.title }}</span>
            <span
              v-if="tabStore.tabs.length > 1"
              class="tab-close"
              @click.stop="closeTab(tab.path)"
            >×</span>
          </button>
          <button
            v-if="tabStore.tabs.length > 1"
            type="button"
            class="tab-more"
            title="标签操作"
            @click.stop="openTabMenu($event, active)"
          >
            <el-icon :size="14"><ArrowDown /></el-icon>
          </button>
        </div>
        <Teleport to="body">
          <div
            v-if="tabMenu.visible"
            class="tab-menu-mask"
            @click="hideTabMenu"
            @contextmenu.prevent="hideTabMenu"
          >
            <ul
              class="tab-menu"
              :style="{ left: `${tabMenu.x}px`, top: `${tabMenu.y}px` }"
              @click.stop
            >
              <li
                class="tab-menu-item"
                :class="{ disabled: tabStore.tabs.length <= 1 }"
                @click="onTabMenu('close')"
              >
                关闭
              </li>
              <li
                class="tab-menu-item"
                :class="{ disabled: tabStore.tabs.length <= 1 }"
                @click="onTabMenu('others')"
              >
                关闭其他
              </li>
              <li
                class="tab-menu-item"
                :class="{ disabled: !canCloseLeft }"
                @click="onTabMenu('left')"
              >
                关闭左侧
              </li>
              <li
                class="tab-menu-item"
                :class="{ disabled: !canCloseRight }"
                @click="onTabMenu('right')"
              >
                关闭右侧
              </li>
            </ul>
          </div>
        </Teleport>
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
          <el-dropdown
            trigger="hover"
            placement="bottom-end"
            :show-timeout="120"
            :hide-timeout="200"
            @command="onUserCommand"
          >
            <el-avatar
              class="avatar-trigger"
              :size="28"
              :src="userStore.avatarUrl || undefined"
            >
              {{ avatarLetter }}
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="layout">
                  <el-icon><Setting /></el-icon>
                  布局设置
                </el-dropdown-item>
                <el-dropdown-item command="lock">
                  <el-icon><Lock /></el-icon>
                  锁定屏幕
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <div class="main-panel">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" :key="active" />
            </keep-alive>
          </router-view>
        </div>
      </el-main>
    </el-container>
    <AiAssistantFloat />
    <LayoutSettingsDrawer v-model="layoutDrawerVisible" />
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowDown, Bell, Lock, Setting, SwitchButton, User } from "@element-plus/icons-vue";
import { ElMessageBox, ElNotification } from "element-plus";
import { fetchAdminMe, logoutAdmin } from "@/api/auth";
import {
  fetchInboxList,
  fetchInboxUnreadCount,
  markInboxAllRead,
  markInboxRead,
  type AdminMessage,
} from "@/api/inbox";
import AiAssistantFloat from "@/components/ai/AiAssistantFloat.vue";
import LayoutSettingsDrawer from "@/components/LayoutSettingsDrawer.vue";
import MenuIcon from "@/components/MenuIcon.vue";
import { buildSidebarMenus, menuIcon } from "@/config/menuGroups";
import { useLockStore } from "@/stores/lock";
import { useTabStore } from "@/stores/tabs";
import { useUserStore, type MenuNode } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const tabStore = useTabStore();
const lockStore = useLockStore();

const avatarLetter = computed(() =>
  (userStore.nickname || userStore.username || "?").slice(0, 1)
);
const layoutDrawerVisible = ref(false);
const tabMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  path: "",
});

const canCloseLeft = computed(() => {
  const index = tabStore.tabs.findIndex((t) => t.path === tabMenu.path);
  return index > 0;
});
const canCloseRight = computed(() => {
  const index = tabStore.tabs.findIndex((t) => t.path === tabMenu.path);
  return index >= 0 && index < tabStore.tabs.length - 1;
});

const sidebarMenus = computed(() => {
  const menus = userStore.isSupplier
    ? filterMenusWithoutAi(userStore.menus)
    : userStore.menus;
  return buildSidebarMenus(menus);
});

function filterMenusWithoutAi(nodes: MenuNode[] | undefined): MenuNode[] {
  return (nodes || [])
    .filter((n) => n.code !== "ai:assistant")
    .map((n) => ({
      ...n,
      children: n.children?.length ? filterMenusWithoutAi(n.children) : n.children,
    }));
}
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
  pollTimer = setInterval(refreshUnread, 10000);
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

function hideTabMenu() {
  tabMenu.visible = false;
}

function openTabMenu(event: MouseEvent, path: string) {
  if (!path) return;
  tabMenu.path = path;
  tabMenu.x = Math.min(event.clientX, window.innerWidth - 140);
  tabMenu.y = Math.min(event.clientY, window.innerHeight - 160);
  tabMenu.visible = true;
}

function onTabMenu(action: "close" | "others" | "left" | "right") {
  const path = tabMenu.path;
  const index = tabStore.tabs.findIndex((t) => t.path === path);
  const activeIndex = tabStore.tabs.findIndex((t) => t.path === route.path);
  hideTabMenu();
  if (!path || index < 0) return;

  if (action === "close") {
    if (tabStore.tabs.length <= 1) return;
    closeTab(path);
    return;
  }
  if (action === "others") {
    if (tabStore.tabs.length <= 1) return;
    tabStore.closeOthers(path);
    if (route.path !== path) router.push(path);
    return;
  }
  if (action === "left") {
    if (index <= 0) return;
    const next = tabStore.closeLeft(path);
    if (activeIndex >= 0 && activeIndex < index && next) {
      router.push(next.path);
    }
    return;
  }
  if (action === "right") {
    if (index >= tabStore.tabs.length - 1) return;
    tabStore.closeRight(path);
    if (activeIndex > index) {
      router.push(path);
    }
  }
}

function onUserCommand(command: string) {
  if (command === "profile") {
    router.push("/profile");
    return;
  }
  if (command === "layout") {
    layoutDrawerVisible.value = true;
    return;
  }
  if (command === "lock") {
    lockStore.lock();
    return;
  }
  if (command === "logout") {
    onLogout();
  }
}

async function onLogout() {
  try {
    await ElMessageBox.confirm("确认退出当前账号？", "退出登录", {
      type: "warning",
      confirmButtonText: "退出",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await logoutAdmin();
  } catch {
    // ignore
  }
  lockStore.unlock();
  tabStore.clear();
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
  background: var(--mall-bg-page);
}
.aside {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--mall-bg-aside);
  color: var(--mall-text-primary);
  border-right: 1px solid var(--mall-border);
}
.brand {
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 700;
  color: var(--mall-text-primary);
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
  padding: 0 10px 12px;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--mall-text-secondary);
  --el-menu-hover-text-color: var(--mall-color-primary);
  --el-menu-hover-bg-color: var(--mall-color-primary-soft-bg);
  --el-menu-active-color: var(--mall-color-primary);
}
.aside :deep(.el-menu-item),
.aside :deep(.el-sub-menu__title) {
  height: 42px;
  line-height: 42px;
  margin: 4px 0;
  border-radius: 10px;
  color: var(--mall-text-secondary) !important;
  font-weight: 400;
}
.aside :deep(.el-menu-item:hover),
.aside :deep(.el-sub-menu__title:hover) {
  background: var(--mall-color-primary-soft-bg) !important;
  color: var(--mall-color-primary) !important;
}
.aside :deep(.el-sub-menu.is-active > .el-sub-menu__title),
.aside :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: var(--mall-color-primary) !important;
  background: var(--mall-color-primary-soft-bg) !important;
}
.aside :deep(.el-menu-item.is-active) {
  background: var(--mall-color-primary-soft-bg) !important;
  color: var(--mall-color-primary) !important;
  box-shadow: none;
}
.aside :deep(.el-menu-item.is-active:hover) {
  background: var(--mall-color-primary-soft-bg) !important;
  color: var(--mall-color-primary) !important;
}
.aside :deep(.el-sub-menu .el-menu) {
  padding: 0;
  background: transparent !important;
}
.aside :deep(.el-sub-menu .el-menu-item) {
  padding-left: 48px !important;
  font-weight: 400;
  min-width: 0;
}
.aside :deep(.el-sub-menu__icon-arrow) {
  color: var(--mall-text-secondary);
  right: 14px;
}
.aside :deep(.el-sub-menu.is-active > .el-sub-menu__title .el-sub-menu__icon-arrow),
.aside :deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow) {
  color: var(--mall-color-primary);
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
  background: var(--mall-bg-header);
  border-bottom: 1px solid var(--mall-border);
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
  border: 1px solid var(--mall-border);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--mall-text-secondary);
  font-size: 13px;
  cursor: pointer;
}
.tab.active {
  background: var(--mall-color-primary-soft-bg);
  border-color: var(--mall-color-primary-soft-border);
  color: var(--mall-color-primary);
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
  color: var(--mall-text-secondary);
}
.tab-close:hover {
  color: var(--mall-text-primary);
}
.tab-more {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 2px;
  border: 1px solid var(--mall-border);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--mall-text-secondary);
  cursor: pointer;
}
.tab-more:hover {
  background: var(--mall-color-primary-soft-bg);
  border-color: var(--mall-color-primary-soft-border);
  color: var(--mall-color-primary);
}
.tab-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 4000;
}
.tab-menu {
  position: fixed;
  min-width: 120px;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--mall-bg-card);
  border: 1px solid var(--mall-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}
.tab-menu-item {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--mall-text-primary);
  cursor: pointer;
  white-space: nowrap;
}
.tab-menu-item:hover:not(.disabled) {
  background: var(--mall-color-primary-soft-bg);
  color: var(--mall-color-primary);
}
.tab-menu-item.disabled {
  color: var(--mall-text-secondary);
  opacity: 0.45;
  cursor: not-allowed;
}
.main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
  background: var(--mall-bg-page);
}
.main-panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.main-panel > *:has(.toolbar),
.main-panel > *:has(.page-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user {
  color: var(--mall-text-secondary);
  font-size: 14px;
}
.avatar-trigger {
  cursor: pointer;
  flex-shrink: 0;
  outline: none;
}
.inbox-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--mall-text-secondary);
  cursor: pointer;
  outline: none;
}
.inbox-trigger:hover {
  color: var(--mall-text-primary);
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
  color: var(--mall-text-secondary);
  font-size: 13px;
}
.inbox-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  border-top: 1px solid var(--mall-border);
  background: var(--mall-bg-card);
  padding: 10px 8px;
  cursor: pointer;
  color: inherit;
}
.inbox-item:hover {
  background: var(--el-fill-color-light);
}
.inbox-item.unread {
  background: var(--mall-color-primary-soft-bg);
}
.inbox-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--mall-text-primary);
}
.inbox-content {
  margin-top: 4px;
  font-size: 12px;
  color: var(--mall-text-secondary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.inbox-time {
  margin-top: 4px;
  font-size: 12px;
  color: var(--mall-text-secondary);
}
</style>
