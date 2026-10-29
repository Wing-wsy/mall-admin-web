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
  const gap = options?.gap ?? 24;

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
    const main = document.querySelector(".layout .main") as HTMLElement | null;
    if (!main) {
      return;
    }
    const style = getComputedStyle(main);
    const padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    tableHeight.value = Math.max(minHeight, Math.floor(main.clientHeight - padY - measureChrome() - gap));
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
