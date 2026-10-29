<template>
  <Teleport to="body">
    <div
      v-if="lockStore.locked"
      class="lock-screen"
      :class="{ 'is-dark': themeStore.mode === 'dark' }"
    >
      <div class="lock-clock">
        <div class="lock-time">{{ nowText.time }}</div>
        <div class="lock-date">{{ nowText.date }}</div>
      </div>

      <div class="lock-card">
        <el-avatar :size="72" :src="userStore.avatarUrl || undefined" class="lock-avatar">
          {{ avatarLetter }}
        </el-avatar>
        <div class="lock-name">{{ userStore.nickname || userStore.username }}</div>
        <div v-if="userStore.username" class="lock-account">{{ userStore.username }}</div>
        <div class="lock-hint">系统已锁定，请输入密码解锁</div>

        <form class="lock-input-wrap" :class="{ error: !!errorText }" @submit.prevent="onUnlock">
          <input
            v-model="password"
            class="lock-input"
            type="password"
            placeholder="请输入登录密码"
            autocomplete="current-password"
            @input="errorText = ''"
          />
          <button class="lock-submit" type="submit" :disabled="loading" :aria-label="'解锁'">
            <el-icon v-if="!loading" :size="18"><ArrowRight /></el-icon>
            <el-icon v-else class="is-loading" :size="18"><Loading /></el-icon>
          </button>
        </form>
        <div v-if="errorText" class="lock-error">{{ errorText }}</div>

        <button type="button" class="lock-logout" @click="onLogout">退出重新登录</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ArrowRight, Loading } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { logoutAdmin, verifyAdminPassword } from "@/api/auth";
import { useLockStore } from "@/stores/lock";
import { useTabStore } from "@/stores/tabs";
import { useThemeStore } from "@/stores/theme";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();
const lockStore = useLockStore();
const tabStore = useTabStore();
const themeStore = useThemeStore();

const password = ref("");
const loading = ref(false);
const errorText = ref("");
const tick = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

const avatarLetter = computed(() =>
  (userStore.nickname || userStore.username || "?").slice(0, 1)
);

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const nowText = computed(() => {
  const d = new Date(tick.value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    date: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`,
  };
});

function startClock() {
  stopClock();
  tick.value = Date.now();
  timer = setInterval(() => {
    tick.value = Date.now();
  }, 1000);
}

function stopClock() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

watch(
  () => lockStore.locked,
  (locked) => {
    if (locked) {
      password.value = "";
      errorText.value = "";
      startClock();
    } else {
      stopClock();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (lockStore.locked) startClock();
});

onUnmounted(stopClock);

async function onUnlock() {
  if (!password.value.trim()) {
    errorText.value = "请输入密码";
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    await verifyAdminPassword(password.value);
    password.value = "";
    errorText.value = "";
    lockStore.unlock();
    ElMessage.success({ message: "已解锁", zIndex: 6000 });
  } catch (e: unknown) {
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message?: string }).message || "")
        : "";
    errorText.value = msg || "密码不正确";
  } finally {
    loading.value = false;
  }
}

async function onLogout() {
  try {
    await logoutAdmin();
  } catch {
    // ignore
  }
  password.value = "";
  lockStore.unlock();
  tabStore.clear();
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.lock-screen {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 24px;
  background: linear-gradient(180deg, #eef3f6 0%, #e8eef2 100%);
}
.lock-screen.is-dark {
  background: #0a0a0a;
}
.lock-clock {
  text-align: center;
  user-select: none;
}
.lock-time {
  font-size: 56px;
  font-weight: 300;
  letter-spacing: 2px;
  line-height: 1.1;
  color: #334155;
  font-variant-numeric: tabular-nums;
}
.lock-screen.is-dark .lock-time {
  color: #e5e7eb;
}
.lock-date {
  margin-top: 8px;
  font-size: 15px;
  color: #94a3b8;
}
.lock-screen.is-dark .lock-date {
  color: #6b7280;
}
.lock-card {
  width: min(380px, calc(100vw - 40px));
  padding: 36px 32px 28px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.lock-screen.is-dark .lock-card {
  background: #151920;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  border: 1px solid #262b35;
}
.lock-avatar {
  flex-shrink: 0;
  background: var(--mall-color-primary-soft-bg, #eff6ff);
  color: var(--mall-color-primary, #2563eb);
  font-weight: 600;
}
.lock-name {
  margin-top: 14px;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}
.lock-screen.is-dark .lock-name {
  color: #e8eaed;
}
.lock-account {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
}
.lock-screen.is-dark .lock-account {
  color: #8b93a1;
}
.lock-hint {
  margin-top: 8px;
  margin-bottom: 22px;
  font-size: 13px;
  color: #94a3b8;
}
.lock-input-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 4px 4px 4px 18px;
  border: 1px solid #dbe4ee;
  border-radius: 999px;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.lock-screen.is-dark .lock-input-wrap {
  background: #0e1116;
  border-color: #2c3340;
}
.lock-input-wrap:focus-within {
  border-color: var(--mall-color-primary, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mall-color-primary, #2563eb) 18%, transparent);
}
.lock-input-wrap.error {
  border-color: #f56c6c;
}
.lock-input-wrap.error:focus-within {
  border-color: #f56c6c;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.2);
}
.lock-error {
  margin-top: 10px;
  width: 100%;
  text-align: center;
  font-size: 13px;
  color: #f56c6c;
  line-height: 1.4;
}
.lock-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #1e293b;
}
.lock-screen.is-dark .lock-input {
  color: #e8eaed;
}
.lock-input::placeholder {
  color: #94a3b8;
}
.lock-screen.is-dark .lock-input::placeholder {
  color: #6b7280;
}
.lock-submit {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--mall-color-primary, #2563eb);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}
.lock-submit:hover:not(:disabled) {
  background: var(--mall-color-primary-dark, #1d4ed8);
}
.lock-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.lock-logout {
  margin-top: 18px;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 13px;
  color: #94a3b8;
  cursor: pointer;
}
.lock-logout:hover {
  color: var(--mall-color-primary, #2563eb);
}
</style>
