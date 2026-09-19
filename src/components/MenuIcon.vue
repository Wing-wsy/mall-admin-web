<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ name?: string }>();

const modules = import.meta.glob("../assets/menu-icons/*.svg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const url = computed(() => {
  if (!props.name) return "";
  const hit = Object.entries(modules).find(([key]) => key.endsWith(`/${props.name}.svg`));
  return hit?.[1] || "";
});

const maskStyle = computed(() =>
  url.value
    ? {
        maskImage: `url("${url.value}")`,
        WebkitMaskImage: `url("${url.value}")`,
      }
    : undefined
);
</script>

<template>
  <i v-if="url" class="menu-icon" :style="maskStyle" aria-hidden="true" />
</template>

<style scoped>
.menu-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 10px;
  flex: 0 0 16px;
  background-color: currentColor;
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}
</style>
