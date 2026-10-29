<template>
  <el-drawer
    :model-value="modelValue"
    title="布局设置"
    size="320px"
    append-to-body
    @close="emit('update:modelValue', false)"
  >
    <div class="section">
      <div class="section-title">主题色</div>
      <div class="presets">
        <button
          v-for="item in THEME_PRESETS"
          :key="item.color"
          type="button"
          class="preset"
          :class="{ active: themeStore.primaryColor === item.color }"
          :style="{ background: item.color }"
          :title="item.label"
          @click="themeStore.setPrimary(item.color)"
        />
        <el-color-picker
          :model-value="themeStore.primaryColor"
          size="small"
          @change="onColorPick"
        />
      </div>
    </div>
    <div class="section">
      <div class="section-title">外观模式</div>
      <el-radio-group :model-value="themeStore.mode" @update:model-value="onModeChange">
        <el-radio-button value="light">白天</el-radio-button>
        <el-radio-button value="dark">黑夜</el-radio-button>
      </el-radio-group>
    </div>
    <div class="section">
      <el-button @click="themeStore.reset()">恢复默认</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { THEME_PRESETS } from "@/utils/theme";
import { useThemeStore } from "@/stores/theme";

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [boolean] }>();

const themeStore = useThemeStore();

function onColorPick(color: string | null) {
  if (color) themeStore.setPrimary(color);
}

function onModeChange(mode: string | number | boolean | undefined) {
  themeStore.setMode(String(mode) === "dark" ? "dark" : "light");
}
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}
.section-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--mall-text-primary, #1f2329);
}
.presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.preset {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.preset.active {
  outline: 2px solid var(--mall-color-primary);
  outline-offset: 2px;
}
</style>
