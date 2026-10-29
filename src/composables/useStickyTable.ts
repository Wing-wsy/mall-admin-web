import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/**
 * 列表页表格吸顶：按主内容区高度减去工具栏/分页等 chrome，给 el-table 绑定 height。
 * 在需计入高度的元素上加 data-sticky-chrome（如 toolbar、pager、tabs）。
 */
export function useStickyTable(options?: { minHeight?: number; gap?: number }) {
  const pageRef = ref<HTMLElement>();
  const toolbarRef = ref<HTMLElement>();
  const pagerRef = ref<HTMLElement>();
  const tableHeight = ref(480);
  const minHeight = options?.minHeight ?? 280;
  /** 卡片间距 + page-body 内边距等余量 */
  const gap = options?.gap ?? 40;

  function measureChrome(): number {
    if (pageRef.value) {
      let sum = 0;
      pageRef.value.querySelectorAll<HTMLElement>("[data-sticky-chrome]").forEach((el) => {
        if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") {
          return;
        }
        sum += el.offsetHeight;
      });
      if (sum > 0) {
        return sum;
      }
    }
    return (toolbarRef.value?.offsetHeight ?? 0) + (pagerRef.value?.offsetHeight ?? 0);
  }

  function syncTableHeight() {
    const panel =
      (document.querySelector(".layout .main-panel") as HTMLElement | null) ||
      (document.querySelector(".layout .main") as HTMLElement | null);
    if (!panel) {
      return;
    }
    const main = document.querySelector(".layout .main") as HTMLElement | null;
    const mainStyle = main ? getComputedStyle(main) : null;
    const padY = mainStyle
      ? (parseFloat(mainStyle.paddingTop) || 0) + (parseFloat(mainStyle.paddingBottom) || 0)
      : 0;
    const available = main ? main.clientHeight - padY : panel.clientHeight;
    tableHeight.value = Math.max(minHeight, Math.floor(available - measureChrome() - gap));
  }

  async function syncTableHeightNextTick() {
    await nextTick();
    syncTableHeight();
  }

  onMounted(() => {
    syncTableHeight();
    window.addEventListener("resize", syncTableHeight);
    void syncTableHeightNextTick();
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", syncTableHeight);
  });

  return {
    pageRef,
    toolbarRef,
    pagerRef,
    tableHeight,
    syncTableHeight,
    syncTableHeightNextTick,
  } satisfies {
    pageRef: Ref<HTMLElement | undefined>;
    toolbarRef: Ref<HTMLElement | undefined>;
    pagerRef: Ref<HTMLElement | undefined>;
    tableHeight: Ref<number>;
    syncTableHeight: () => void;
    syncTableHeightNextTick: () => Promise<void>;
  };
}
