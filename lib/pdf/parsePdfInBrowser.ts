type WorkerSuccess = {
  type: "success";
  text: string;
  pageCount: number;
};

type WorkerFailure = {
  type: "error";
  message: string;
};

type WorkerResponse = WorkerSuccess | WorkerFailure;

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const PDF_PARSE_TIMEOUT_MS = 30_000;

export async function parsePdfInBrowser(file: File): Promise<{ text: string; pageCount: number }> {
  if (typeof window === "undefined") {
    throw new Error("PDF 解析只能在浏览器中执行。");
  }

  if (file.size > MAX_PDF_SIZE) {
    throw new Error("PDF 文件不能超过 10MB。");
  }

  const buffer = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../../workers/mupdf-parser.worker.ts", import.meta.url), {
      type: "module"
    });

    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      worker.terminate();
      callback();
    };

    const timeoutId = window.setTimeout(() => {
      finish(() => {
        reject(new Error("MuPDF 加载或解析超时。请检查浏览器控制台中的 Worker/WASM 错误，或更换浏览器后重试。"));
      });
    }, PDF_PARSE_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      finish(() => {
        if (event.data.type === "success") {
          resolve({ text: event.data.text, pageCount: event.data.pageCount });
        } else {
          reject(new Error(event.data.message));
        }
      });
    };

    worker.onerror = (event) => {
      finish(() => {
        reject(new Error(event.message || "MuPDF Worker 脚本加载失败。"));
      });
    };

    worker.onmessageerror = () => {
      finish(() => {
        reject(new Error("MuPDF Worker 返回了无法读取的数据。"));
      });
    };

    worker.postMessage({ type: "parse", buffer }, [buffer]);
  });
}
