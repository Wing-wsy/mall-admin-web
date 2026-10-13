<template>
  <div class="ai-chat" :class="{ compact }">
    <div v-if="showHint" class="ai-hint">
      回答制度与操作说明（占位知识库）。支持流式。不查订单/会员，不能改后台数据。
    </div>

    <div ref="listRef" class="ai-list">
      <div v-if="!store.messages.length" class="ai-empty">
        试试问：「满多少包邮？」「退货规则是什么？」
      </div>
      <div
        v-for="(m, i) in store.messages"
        :key="i"
        class="ai-row"
        :class="m.role === 'user' ? 'is-user' : 'is-assistant'"
      >
        <div
          class="ai-bubble"
          :class="{ 'is-loading': m.streaming && !m.content }"
          v-html="bubbleHtml(m)"
        />
      </div>
    </div>

    <div class="ai-input">
      <el-input
        v-model="store.input"
        type="textarea"
        :rows="compact ? 2 : 2"
        maxlength="1000"
        show-word-limit
        placeholder="输入问题，Enter 发送"
        :disabled="store.sending"
        @keydown="onKeydown"
      />
      <div class="ai-actions">
        <el-button
          @click="onClear"
          :disabled="store.sending || (!store.messages.length && !store.sessionId)"
        >
          新会话
        </el-button>
        <el-button type="primary" :loading="store.sending" @click="onSend">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { ElMessage } from "element-plus";
import { streamChatWithAssistant } from "@/api/ai";
import { useAiAssistantStore, type AiChatMessage } from "@/stores/aiAssistant";

withDefaults(
  defineProps<{
    compact?: boolean;
    showHint?: boolean;
  }>(),
  {
    compact: false,
    showHint: true,
  }
);

const store = useAiAssistantStore();
const listRef = ref<HTMLElement | null>(null);

async function scrollBottom() {
  await nextTick();
  const el = listRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function bubbleHtml(m: AiChatMessage) {
  const raw = m.content || (m.streaming ? "思考中…" : "");
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function onClear() {
  store.clearSession();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
}

async function onSend() {
  const text = store.input.trim();
  if (!text || store.sending) return;

  store.messages.push({ role: "user", content: text });
  store.input = "";
  store.sending = true;
  store.messages.push({ role: "assistant", content: "", streaming: true });
  const assistantIndex = store.messages.length - 1;
  await scrollBottom();

  const patchAssistant = (patch: Partial<AiChatMessage>) => {
    const cur = store.messages[assistantIndex];
    if (!cur) return;
    store.messages[assistantIndex] = { ...cur, ...patch };
  };

  try {
    await streamChatWithAssistant(
      {
        sessionId: store.sessionId || undefined,
        message: text,
      },
      {
        onSession: (id) => {
          store.sessionId = id;
        },
        onToken: (token) => {
          const cur = store.messages[assistantIndex];
          if (!cur) return;
          store.messages[assistantIndex] = {
            ...cur,
            content: cur.content + token,
          };
          scrollBottom();
        },
        onDone: () => patchAssistant({ streaming: false }),
        onError: (message) => {
          const cur = store.messages[assistantIndex];
          patchAssistant({
            content: cur?.content || message || "调用失败",
            streaming: false,
          });
          ElMessage.error(message || "AI 调用失败");
        },
      }
    );
    const cur = store.messages[assistantIndex];
    if (cur && !cur.content) {
      patchAssistant({ content: "（无回复）", streaming: false });
    } else {
      patchAssistant({ streaming: false });
    }
  } catch (e) {
    patchAssistant({
      streaming: false,
      content: e instanceof Error ? e.message : "调用失败，请稍后重试",
    });
    ElMessage.error("AI 调用失败");
  } finally {
    store.sending = false;
    await scrollBottom();
  }
}

defineExpose({ scrollBottom });
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 10px;
}

.ai-hint {
  color: #666;
  font-size: 12px;
  line-height: 1.5;
  flex-shrink: 0;
}

.ai-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.ai-empty {
  color: #909399;
  font-size: 13px;
  padding: 16px 4px;
}

.ai-row {
  display: flex;
  margin-bottom: 10px;
}

.ai-row.is-user {
  justify-content: flex-end;
}

.ai-row.is-assistant {
  justify-content: flex-start;
}

.ai-bubble {
  max-width: 88%;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  font-size: 13px;
}

.is-user .ai-bubble {
  background: #409eff;
  color: #fff;
}

.is-assistant .ai-bubble {
  background: #fff;
  border: 1px solid #e4e7ed;
  color: #303133;
}

.ai-bubble.is-loading {
  color: #909399;
}

.ai-bubble :deep(strong) {
  font-weight: 700;
}

.ai-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.ai-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
