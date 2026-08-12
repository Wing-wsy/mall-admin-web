import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface MenuNode {
  id: number;
  parentId?: number;
  name: string;
  code: string;
  type: number;
  path?: string;
  sort?: number;
  children?: MenuNode[];
}

export const useUserStore = defineStore("user", () => {
  const token = ref(localStorage.getItem("mall_admin_token") || "");
  const username = ref(localStorage.getItem("mall_admin_username") || "");
  const nickname = ref(localStorage.getItem("mall_admin_nickname") || "");
  const tenantId = ref<number | null>(Number(localStorage.getItem("mall_admin_tenant_id") || 0) || null);
  const tenantName = ref(localStorage.getItem("mall_admin_tenant_name") || "");
  const tenantType = ref<number | null>(Number(localStorage.getItem("mall_admin_tenant_type") || 0) || null);
  const permissions = ref<string[]>(JSON.parse(localStorage.getItem("mall_admin_permissions") || "[]"));
  const menus = ref<MenuNode[]>(JSON.parse(localStorage.getItem("mall_admin_menus") || "[]"));

  const flatMenus = computed(() => {
    const list: { title: string; path: string; code: string }[] = [];
    const walk = (nodes: MenuNode[]) => {
      for (const n of nodes || []) {
        if (n.path) {
          list.push({ title: n.name, path: n.path, code: n.code });
        }
        if (n.children?.length) walk(n.children);
      }
    };
    walk(menus.value);
    return list;
  });

  function hasPermission(code: string) {
    return permissions.value.includes(code);
  }

  function login(profile: {
    token: string;
    username: string;
    nickname?: string;
    tenantId?: number;
    tenantName?: string;
    tenantType?: number;
    permissions?: string[];
    menus?: MenuNode[];
  }) {
    token.value = profile.token;
    username.value = profile.username;
    nickname.value = profile.nickname || profile.username;
    tenantId.value = profile.tenantId ?? null;
    tenantName.value = profile.tenantName || "";
    tenantType.value = profile.tenantType ?? null;
    permissions.value = profile.permissions || [];
    menus.value = profile.menus || [];
    localStorage.setItem("mall_admin_token", profile.token);
    localStorage.setItem("mall_admin_username", profile.username);
    localStorage.setItem("mall_admin_nickname", nickname.value);
    localStorage.setItem("mall_admin_tenant_id", String(profile.tenantId || ""));
    localStorage.setItem("mall_admin_tenant_name", tenantName.value);
    localStorage.setItem("mall_admin_tenant_type", String(profile.tenantType || ""));
    localStorage.setItem("mall_admin_permissions", JSON.stringify(permissions.value));
    localStorage.setItem("mall_admin_menus", JSON.stringify(menus.value));
  }

  function logout() {
    token.value = "";
    username.value = "";
    nickname.value = "";
    tenantId.value = null;
    tenantName.value = "";
    tenantType.value = null;
    permissions.value = [];
    menus.value = [];
    [
      "mall_admin_token",
      "mall_admin_username",
      "mall_admin_nickname",
      "mall_admin_tenant_id",
      "mall_admin_tenant_name",
      "mall_admin_tenant_type",
      "mall_admin_permissions",
      "mall_admin_menus",
    ].forEach((k) => localStorage.removeItem(k));
  }

  return {
    token,
    username,
    nickname,
    tenantId,
    tenantName,
    tenantType,
    permissions,
    menus,
    flatMenus,
    hasPermission,
    login,
    logout,
  };
});
