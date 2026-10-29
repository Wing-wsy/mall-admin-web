<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "solid" | "soft" | "danger" | "warn";
    icon?: string;
    disabled?: boolean;
  }>(),
  {
    variant: "soft",
    disabled: false,
  },
);

defineEmits<{ click: [MouseEvent] }>();
</script>

<template>
  <button
    type="button"
    class="op-btn"
    :class="`op-btn--${variant}`"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <el-icon v-if="icon"><component :is="icon" /></el-icon>
    <span><slot /></span>
  </button>
</template>
