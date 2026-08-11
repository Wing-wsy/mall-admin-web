import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const token = ref(localStorage.getItem("mall_admin_token") || "");
  const username = ref(localStorage.getItem("mall_admin_username") || "");

  function login(name: string, fakeToken: string) {
    username.value = name;
    token.value = fakeToken;
    localStorage.setItem("mall_admin_username", name);
    localStorage.setItem("mall_admin_token", fakeToken);
  }

  function logout() {
    username.value = "";
    token.value = "";
    localStorage.removeItem("mall_admin_username");
    localStorage.removeItem("mall_admin_token");
  }

  return { token, username, login, logout };
});
