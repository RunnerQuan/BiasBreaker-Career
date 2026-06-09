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

    const terminate = () => worker.terminate();

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      terminate();
      if (event.data.type === "success") {
        resolve({ text: event.data.text, pageCount: event.data.pageCount });
      } else {
        reject(new Error(event.data.message));
      }
    };

    worker.onerror = (event) => {
      terminate();
      reject(new Error(event.message || "MuPDF 解析线程运行失败。"));
    };

    worker.postMessage({ type: "parse", buffer }, [buffer]);
  });
}
