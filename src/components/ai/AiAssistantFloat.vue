<template>
  <div v-if="visible" class="ai-float" :style="floatStyle">
    <transition name="ai-panel">
      <div
        v-if="store.open"
        class="ai-panel"
        :class="{ 'open-below': panelBelow }"
        role="dialog"
        aria-label="AI 助手"
      >
        <div
          class="ai-panel-head"
          :class="{ dragging: dragging }"
          title="按住拖动"
          @pointerdown="onPanelPointerDown"
        >
          <span class="ai-panel-title">AI 助手</span>
          <div class="ai-panel-actions" @pointerdown.stop>
            <el-button link type="primary" @click="goFullPage">整页</el-button>
            <button type="button" class="ai-close" title="关闭" @click="store.toggle(false)">×</button>
          </div>
        </div>
        <div class="ai-panel-body">
          <AiAssistantChat compact :show-hint="false" />
        </div>
      </div>
    </transition>

    <button
      v-show="!store.open"
      type="button"
      class="ai-fab"
      :class="{ dragging: dragging }"
      title="AI 助手（可拖动）"
      @pointerdown="onPointerDown"
    >
      <el-icon :size="26"><ChatDotRound /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChatDotRound } from "@element-plus/icons-vue";
import AiAssistantChat from "@/components/ai/AiAssistantChat.vue";
import { useAiAssistantStore } from "@/stores/aiAssistant";
import { useUserStore } from "@/stores/user";

const STORAGE_KEY = "mall_admin_ai_fab_pos";
const FAB_SIZE = 56;
const MARGIN = 12;
const PANEL_H = 560;
const DRAG_THRESHOLD = 6;

const store = useAiAssistantStore();
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const visible = computed(
  () => userStore.hasPermission("ai:assistant") && route.path !== "/login"
);

const left = ref(0);
const top = ref(0);
const dragging = ref(false);
const moved = ref(false);

let startX = 0;
let startY = 0;
let originLeft = 0;
let originTop = 0;
let activePointerId: number | null = null;

const floatStyle = computed(() => ({
  left: `${left.value}px`,
  top: `${top.value}px`,
}));

/** 靠近顶部时面板改到图标下方，避免被裁切 */
const panelBelow = computed(() => top.value < PANEL_H + MARGIN + 40);

function clampPos(x: number, y: number) {
  const maxL = Math.max(MARGIN, window.innerWidth - FAB_SIZE - MARGIN);
  const maxT = Math.max(MARGIN, window.innerHeight - FAB_SIZE - MARGIN);
  return {
    left: Math.min(maxL, Math.max(MARGIN, x)),
    top: Math.min(maxT, Math.max(MARGIN, y)),
  };
}

function defaultPos() {
  return clampPos(
    window.innerWidth - FAB_SIZE - 24,
    window.innerHeight - FAB_SIZE - 24
  );
}

function loadPos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { left?: number; top?: number };
      if (typeof parsed.left === "number" && typeof parsed.top === "number") {
        const pos = clampPos(parsed.left, parsed.top);
        left.value = pos.left;
        top.value = pos.top;
        return;
      }
    }
  } catch {
    // ignore
  }
  const pos = defaultPos();
  left.value = pos.left;
  top.value = pos.top;
}

function savePos() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ left: left.value, top: top.value })
  );
}

/** false=拖 FAB（松手未移动则打开）；true=拖面板标题栏（松手只落位） */
let dragPanel = false;

function beginDrag(e: PointerEvent, panel: boolean) {
  if (e.button !== 0) return;
  e.preventDefault();
  dragPanel = panel;
  dragging.value = true;
  moved.value = false;
  activePointerId = e.pointerId;
  startX = e.clientX;
  startY = e.clientY;
  originLeft = left.value;
  originTop = top.value;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
}

function onPointerDown(e: PointerEvent) {
  beginDrag(e, false);
}

function onPanelPointerDown(e: PointerEvent) {
  beginDrag(e, true);
}

function onPointerMove(e: PointerEvent) {
  if (activePointerId !== null && e.pointerId !== activePointerId) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  if (!moved.value && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
    moved.value = true;
  }
  if (!moved.value) return;
  const pos = clampPos(originLeft + dx, originTop + dy);
  left.value = pos.left;
  top.value = pos.top;
}

function onPointerUp(e: PointerEvent) {
  if (activePointerId !== null && e.pointerId !== activePointerId) return;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
  dragging.value = false;
  activePointerId = null;
  if (moved.value) {
    savePos();
  } else if (!dragPanel) {
    store.toggle(true);
  }
  moved.value = false;
  dragPanel = false;
}

function onResize() {
  const pos = clampPos(left.value, top.value);
  left.value = pos.left;
  top.value = pos.top;
}

function goFullPage() {
  store.toggle(false);
  router.push("/ai-assistant");
}

onMounted(() => {
  loadPos();
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
});
</script>

<style scoped>
.ai-float {
  position: fixed;
  z-index: 3000;
  width: 56px;
  height: 56px;
  pointer-events: none;
}

.ai-float > * {
  pointer-events: auto;
}

.ai-fab {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  transition: box-shadow 0.15s ease;
}

.ai-fab:hover {
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45);
}

.ai-fab.dragging {
  cursor: grabbing;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.5);
}

.ai-panel {
  position: absolute;
  right: 0;
  bottom: 68px;
  width: min(400px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 120px));
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-panel.open-below {
  bottom: auto;
  top: 68px;
}

.ai-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.ai-panel-head.dragging {
  cursor: grabbing;
}

.ai-panel-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.ai-panel-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #909399;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
}

.ai-close:hover {
  background: #f5f7fa;
  color: #303133;
}

.ai-panel-body {
  flex: 1;
  min-height: 0;
  padding: 12px;
}

.ai-panel-enter-active,
.ai-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.ai-panel-enter-from,
.ai-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
