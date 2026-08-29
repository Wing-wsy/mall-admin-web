import type { CategoryTreeVO } from "@/api/category";
import type { ProductVO } from "@/api/product";

export interface ProductPickTreeOption {
  value: number | string;
  label: string;
  disabled?: boolean;
  children?: ProductPickTreeOption[];
}

/** 分类节点 value 前缀，避免与商品 id 冲突 */
const CATEGORY_VALUE_PREFIX = "c:";

export const productPickCascaderProps = {
  value: "value",
  label: "label",
  children: "children",
  disabled: "disabled",
  emitPath: false,
} as const;

/**
 * 商品分类树 + 商品列表 → 级联选项（叶子为商品，选中值为 productId）
 */
export function buildProductPickTree(
  categories: CategoryTreeVO[],
  products: ProductVO[],
): ProductPickTreeOption[] {
  const byCategory = new Map<number, ProductVO[]>();
  for (const product of products || []) {
    const cid = product.categoryId;
    if (cid == null) continue;
    const bucket = byCategory.get(cid);
    if (bucket) {
      bucket.push(product);
    } else {
      byCategory.set(cid, [product]);
    }
  }

  function walk(nodes: CategoryTreeVO[], parentDisabled = false): ProductPickTreeOption[] {
    const result: ProductPickTreeOption[] = [];
    for (const node of nodes || []) {
      const disabled = parentDisabled || node.status !== 1;
      const childCats = walk(node.children || [], disabled);
      const productsHere = (byCategory.get(node.id) || []).map((p) => ({
        value: p.id,
        label: `${p.name} (#${p.id})`,
        disabled,
      }));
      const children = [...childCats, ...productsHere];
      if (!children.length) {
        continue;
      }
      result.push({
        value: `${CATEGORY_VALUE_PREFIX}${node.id}`,
        label: node.name,
        disabled,
        children,
      });
    }
    return result;
  }

  return walk(categories || []);
}

export function firstProductId(tree: ProductPickTreeOption[]): number | undefined {
  for (const node of tree) {
    if (typeof node.value === "number" && !node.disabled) {
      return node.value;
    }
    if (node.children?.length) {
      const found = firstProductId(node.children);
      if (found != null) return found;
    }
  }
  return undefined;
}
