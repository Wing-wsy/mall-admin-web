import { defineStore } from "pinia";
import { ref } from "vue";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export const useAiAssistantStore = defineStore("aiAssistant", () => {
  const open = ref(false);
  const messages = ref<AiChatMessage[]>([]);
  const sessionId = ref("");
  const input = ref("");
  const sending = ref(false);

  function toggle(force?: boolean) {
    open.value = force === undefined ? !open.value : force;
  }

  function clearSession() {
    messages.value = [];
    sessionId.value = "";
    input.value = "";
  }

  return {
    open,
    messages,
    sessionId,
    input,
    sending,
    toggle,
    clearSession,
  };
});
