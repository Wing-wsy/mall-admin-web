import { defineStore } from "pinia";
import { ref, watch } from "vue";

export interface TabItem {
  path: string;
  title: string;
}

const STORAGE_KEY = "mall_admin_tabs";

function readStored(): TabItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as TabItem[]) : [];
    return Array.isArray(list) ? list.filter((t) => t?.path && t?.title) : [];
  } catch {
    return [];
  }
}

export const useTabStore = defineStore("tabs", () => {
  const tabs = ref<TabItem[]>(readStored());

  watch(
    tabs,
    (list) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    },
    { deep: true }
  );

  function add(tab: TabItem) {
    if (!tab.path || tab.path === "/login") return;
    if (tabs.value.some((t) => t.path === tab.path)) return;
    tabs.value.push({ path: tab.path, title: tab.title });
  }

  function close(path: string): TabItem | null {
    const index = tabs.value.findIndex((t) => t.path === path);
    if (index < 0) return null;
    if (tabs.value.length <= 1) return tabs.value[0] || null;
    tabs.value.splice(index, 1);
    return tabs.value[index] || tabs.value[index - 1] || null;
  }

  function clear() {
    tabs.value = [];
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return { tabs, add, close, clear };
});
