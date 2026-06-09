type WorkerReady = {
  type: "ready";
};

type WorkerSuccess = {
  type: "success";
  requestId: number;
  text: string;
  pageCount: number;
};

type WorkerFailure = {
  type: "error";
  requestId: number;
  message: string;
};

type WorkerResponse = WorkerReady | WorkerSuccess | WorkerFailure;

type PendingRequest = {
  resolve: (value: { text: string; pageCount: number }) => void;
  reject: (reason: Error) => void;
  timeoutId: number;
};

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MUPDF_INIT_TIMEOUT_MS = 120_000;
const PDF_PARSE_TIMEOUT_MS = 90_000;

let worker: Worker | null = null;
let workerReadyPromise: Promise<Worker> | null = null;
let nextRequestId = 1;
const pendingRequests = new Map<number, PendingRequest>();

function resetWorker(error?: Error) {
  worker?.terminate();
  worker = null;
  workerReadyPromise = null;

  for (const pending of pendingRequests.values()) {
    window.clearTimeout(pending.timeoutId);
    pending.reject(error || new Error("MuPDF Worker 已终止，请重试。"));
  }
  pendingRequests.clear();
}

function getMupdfWorker(): Promise<Worker> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PDF 解析只能在浏览器中执行。"));
  }

  if (worker && workerReadyPromise) return workerReadyPromise;

  worker = new Worker(new URL("../../workers/mupdf-parser.worker.ts", import.meta.url), {
    type: "module"
  });

  workerReadyPromise = new Promise<Worker>((resolve, reject) => {
    const currentWorker = worker;
    if (!currentWorker) {
      reject(new Error("MuPDF Worker 创建失败。"));
      return;
    }

    const initTimeoutId = window.setTimeout(() => {
      const error = new Error("MuPDF 初始化超时，请检查网络后重试。");
      resetWorker(error);
      reject(error);
    }, MUPDF_INIT_TIMEOUT_MS);

    currentWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.type === "ready") {
        window.clearTimeout(initTimeoutId);
        resolve(currentWorker);
        return;
      }

      const pending = pendingRequests.get(message.requestId);
      if (!pending) return;

      window.clearTimeout(pending.timeoutId);
      pendingRequests.delete(message.requestId);

      if (message.type === "success") {
        pending.resolve({ text: message.text, pageCount: message.pageCount });
      } else {
        pending.reject(new Error(message.message));
      }
    };

    currentWorker.onerror = (event) => {
      window.clearTimeout(initTimeoutId);
      const error = new Error(
        event.message
          ? `MuPDF Worker 加载失败：${event.message}`
          : "MuPDF Worker 脚本加载失败，请检查 Worker 与 WASM 静态资源。"
      );
      console.error("[MuPDF Worker error]", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
      resetWorker(error);
      reject(error);
    };

    currentWorker.onmessageerror = () => {
      window.clearTimeout(initTimeoutId);
      const error = new Error("MuPDF Worker 返回了无法读取的数据。");
      resetWorker(error);
      reject(error);
    };
  });

  return workerReadyPromise;
}

export function preloadMupdf() {
  if (typeof window === "undefined") return;

  void getMupdfWorker().catch((error) => {
    console.error("[MuPDF preload failed]", error);
  });
}

export async function parsePdfInBrowser(file: File): Promise<{ text: string; pageCount: number }> {
  if (typeof window === "undefined") {
    throw new Error("PDF 解析只能在浏览器中执行。");
  }

  if (file.size > MAX_PDF_SIZE) {
    throw new Error("PDF 文件不能超过 10MB。");
  }

  const currentWorker = await getMupdfWorker();
  const buffer = await file.arrayBuffer();
  const requestId = nextRequestId++;

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("MuPDF 解析超时，请缩小 PDF 文件后重试。"));
    }, PDF_PARSE_TIMEOUT_MS);

    pendingRequests.set(requestId, { resolve, reject, timeoutId });
    currentWorker.postMessage({ type: "parse", requestId, buffer }, [buffer]);
  });
}
