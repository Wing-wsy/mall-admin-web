<template>
  <div class="ai-page">
    <div class="ai-hint">
      回答制度与操作说明（当前为占位知识库）。支持流式输出。不查询订单/会员数据，也不能替你改后台数据。
    </div>

    <div ref="listRef" class="ai-list">
      <div v-if="!messages.length" class="ai-empty">
        试试问：「满多少包邮？」「退货规则是什么？」「后台怎么登录鉴权？」
      </div>
      <div
        v-for="(m, i) in messages"
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
        v-model="input"
        type="textarea"
        :rows="2"
        maxlength="1000"
        show-word-limit
        placeholder="输入问题，Enter 发送（Shift+Enter 换行）"
        :disabled="sending"
        @keydown="onKeydown"
      />
      <div class="ai-actions">
        <el-button @click="onClear" :disabled="sending || (!messages.length && !sessionId)">
          新会话
        </el-button>
        <el-button type="primary" :loading="sending" @click="onSend">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { ElMessage } from "element-plus";
import { streamChatWithAssistant } from "@/api/ai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const messages = ref<ChatMessage[]>([]);
const input = ref("");
const sending = ref(false);
const sessionId = ref("");
const listRef = ref<HTMLElement | null>(null);

async function scrollBottom() {
  await nextTick();
  const el = listRef.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

/** 转义 HTML，并把 **加粗** 渲染成粗体 */
function bubbleHtml(m: ChatMessage) {
  const raw = m.content || (m.streaming ? "思考中…" : "");
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function onClear() {
  messages.value = [];
  sessionId.value = "";
  input.value = "";
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
}

async function onSend() {
  const text = input.value.trim();
  if (!text || sending.value) return;

  messages.value.push({ role: "user", content: text });
  input.value = "";
  sending.value = true;

  const assistant: ChatMessage = { role: "assistant", content: "", streaming: true };
  messages.value.push(assistant);
  await scrollBottom();

  try {
    await streamChatWithAssistant(
      {
        sessionId: sessionId.value || undefined,
        message: text,
      },
      {
        onSession: (id) => {
          sessionId.value = id;
        },
        onToken: (token) => {
          assistant.content += token;
          scrollBottom();
        },
        onDone: () => {
          assistant.streaming = false;
        },
        onError: (message) => {
          if (!assistant.content) {
            assistant.content = message || "调用失败";
          }
          assistant.streaming = false;
          ElMessage.error(message || "AI 调用失败");
        },
      }
    );
    if (!assistant.content) {
      assistant.content = "（无回复）";
    }
    assistant.streaming = false;
  } catch (e) {
    assistant.streaming = false;
    assistant.content = e instanceof Error ? e.message : "调用失败，请稍后重试";
    ElMessage.error("AI 调用失败");
  } finally {
    sending.value = false;
    await scrollBottom();
  }
}
</script>

<style scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
  min-height: 420px;
  gap: 12px;
}

.ai-hint {
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

.ai-list {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.ai-empty {
  color: #909399;
  font-size: 13px;
  padding: 24px 8px;
}

.ai-row {
  display: flex;
  margin-bottom: 12px;
}

.ai-row.is-user {
  justify-content: flex-end;
}

.ai-row.is-assistant {
  justify-content: flex-start;
}

.ai-bubble {
  max-width: min(720px, 85%);
  padding: 10px 14px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  font-size: 14px;
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
  color: inherit;
}

.ai-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
