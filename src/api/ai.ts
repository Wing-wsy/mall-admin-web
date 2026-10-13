import request, { type ApiResult } from "@/utils/request";

export interface AiChatPayload {
  sessionId?: string;
  message: string;
}

export interface AiChatResult {
  sessionId: string;
  reply: string;
}

export interface AiStreamHandlers {
  onSession?: (sessionId: string) => void;
  onToken?: (token: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

/** 非流式：一次返回完整回复 */
export function chatWithAssistant(data: AiChatPayload) {
  return request.post<ApiResult<AiChatResult>>("/api/admin/ai/assistant", data, {
    timeout: 90000,
  });
}

/**
 * SSE 流式：event = session | message | done | error
 * 用 fetch（EventSource 不支持自定义 Authorization / POST）
 */
export async function streamChatWithAssistant(data: AiChatPayload, handlers: AiStreamHandlers) {
  const base = import.meta.env.VITE_APP_API_BASE || "";
  const token = localStorage.getItem("mall_admin_token") || "";
  const res = await fetch(`${base}/api/admin/ai/assistant/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error("浏览器不支持流式读取");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let eventName = "message";

  const dispatch = (name: string, payload: string) => {
    if (name === "session") {
      handlers.onSession?.(payload);
    } else if (name === "message") {
      handlers.onToken?.(payload);
    } else if (name === "done") {
      handlers.onDone?.();
    } else if (name === "error") {
      handlers.onError?.(payload || "流式调用失败");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 事件以空行分隔
    let splitAt: number;
    while ((splitAt = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, splitAt);
      buffer = buffer.slice(splitAt + 2);
      eventName = "message";
      const dataLines: string[] = [];

      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).replace(/^ /, ""));
        }
      }
      if (dataLines.length) {
        dispatch(eventName, dataLines.join("\n"));
      }
    }
  }
}
