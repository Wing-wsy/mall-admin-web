import { defineStore } from "pinia";
import { ref } from "vue";

const STORAGE_KEY = "mall_admin_screen_locked";

export const useLockStore = defineStore("lock", () => {
  const locked = ref(localStorage.getItem(STORAGE_KEY) === "1");

  function lock() {
    locked.value = true;
    localStorage.setItem(STORAGE_KEY, "1");
  }

  function unlock() {
    locked.value = false;
    localStorage.removeItem(STORAGE_KEY);
  }

  return { locked, lock, unlock };
});
