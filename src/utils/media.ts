const LOCAL_MINIO = "http://127.0.0.1:9000";
const BUCKET = "mall";

/**
 * 开发：把 view / 局域网 MinIO 地址改到本机 127.0.0.1:9000，方便本地看图。
 * 生产：不做改写，原样使用接口返回的 URL。
 */
export function resolveMediaUrl(url: string): string {
  const raw = (url || "").trim();
  if (!raw) {
    return raw;
  }

  if (!import.meta.env.DEV) {
    return raw;
  }

  const view = raw.match(/\/api\/(?:app|admin)\/file\/view\/([^?\s"']+)/i);
  if (view) {
    return `${LOCAL_MINIO}/${BUCKET}/${decodeURIComponent(view[1])}`;
  }

  const minio = raw.match(/^(https?:\/\/)([^/]+)\/mall\/(.+)$/i);
  if (minio) {
    const host = minio[2].toLowerCase();
    if (host.startsWith("127.0.0.1") || host.startsWith("localhost")) {
      return raw;
    }
    return `${LOCAL_MINIO}/mall/${minio[3]}`;
  }

  return raw;
}

export function rewriteMediaUrls<T>(node: T): T {
  if (typeof node === "string") {
    if (!node.includes("://") && !node.includes("/api/")) {
      return node;
    }
    if (node.includes("<") && /src\s*=/i.test(node)) {
      return node.replace(/https?:\/\/[^"'\s>]+/g, (match) => resolveMediaUrl(match)) as T;
    }
    return resolveMediaUrl(node) as T;
  }
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      node[index] = rewriteMediaUrls(item);
    });
    return node;
  }
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      record[key] = rewriteMediaUrls(record[key]);
    }
  }
  return node;
}
