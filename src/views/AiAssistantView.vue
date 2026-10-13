<template>
  <div class="ai-page">
    <AiAssistantChat />
  </div>
</template>

<script setup lang="ts">
import AiAssistantChat from "@/components/ai/AiAssistantChat.vue";
</script>

<style scoped>
.ai-page {
  height: calc(100vh - 140px);
  min-height: 420px;
}
</style>
