import { defineStore } from "pinia";
import { ref } from "vue";
import {
  DEFAULT_PRIMARY,
  applyTheme,
  normalizeHex,
  persistMode,
  persistPrimary,
  readStoredMode,
  readStoredPrimary,
  type ThemeMode,
} from "@/utils/theme";

export const useThemeStore = defineStore("theme", () => {
  const primaryColor = ref(readStoredPrimary());
  const mode = ref<ThemeMode>(readStoredMode());

  function apply() {
    applyTheme(primaryColor.value, mode.value);
  }

  function setPrimary(color: string) {
    primaryColor.value = normalizeHex(color);
    persistPrimary(primaryColor.value);
    apply();
  }

  function setMode(next: ThemeMode) {
    mode.value = next === "dark" ? "dark" : "light";
    persistMode(mode.value);
    apply();
  }

  function reset() {
    primaryColor.value = DEFAULT_PRIMARY;
    mode.value = "light";
    persistPrimary(primaryColor.value);
    persistMode(mode.value);
    apply();
  }

  return { primaryColor, mode, apply, setPrimary, setMode, reset };
});
