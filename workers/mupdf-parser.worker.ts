type ParseRequest = {
  type: "parse";
  buffer: ArrayBuffer;
};

type ParseSuccess = {
  type: "success";
  text: string;
  pageCount: number;
};

type ParseFailure = {
  type: "error";
  message: string;
};

type WorkerScope = {
  onmessage: ((event: MessageEvent<ParseRequest>) => void) | null;
  postMessage(message: ParseSuccess | ParseFailure): void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.onmessage = async (event) => {
  if (event.data.type !== "parse") return;

  try {
    const mupdf = await import("mupdf");
    let document: InstanceType<typeof mupdf.Document> | undefined;

    try {
      document = mupdf.Document.openDocument(event.data.buffer, "application/pdf");

      if (document.needsPassword()) {
        throw new Error("该 PDF 已加密，请先解除密码保护后重新上传。");
      }

      const pageCount = document.countPages();
      if (pageCount === 0) throw new Error("PDF 中没有可读取页面。");
      if (pageCount > 20) throw new Error("简历 PDF 页数不能超过 20 页。");

      const pages: string[] = [];

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const page = document.loadPage(pageIndex);
        try {
          const structuredText = page.toStructuredText("preserve-whitespace");
          try {
            pages.push(structuredText.asText());
          } finally {
            structuredText.destroy();
          }
        } finally {
          page.destroy();
        }
      }

      const text = normalizeExtractedText(pages.join("\n\n"));
      if (!isHighQualityText(text)) {
        throw new Error("未能从 PDF 中提取到足够的可读文本，该文件可能是扫描件或文字已转为图片/路径。");
      }

      workerScope.postMessage({ type: "success", text, pageCount });
    } finally {
      document?.destroy();
    }
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      message:
        error instanceof Error
          ? `MuPDF 初始化或解析失败：${error.message}`
          : "MuPDF 初始化或解析失败。"
    });
  }
};

function normalizeExtractedText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/⻓/g, "长")
    .replace(/⻢/g, "马")
    .replace(/([0-9])\s+([0-9])/g, "$1$2")
    .replace(/([0-9])\s*\.\s*([0-9])/g, "$1.$2")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+([%)）])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isHighQualityText(text: string) {
  const trimmed = text.trim();
  if (trimmed.length < 80) return false;

  const invalidCount = (trimmed.match(/[\u0000\uFFFD]/g) || []).length;
  const readableCount = (trimmed.match(/[\u4e00-\u9fffA-Za-z0-9]/g) || []).length;
  return invalidCount === 0 && readableCount / Math.max(1, trimmed.length) > 0.35;
}

export {};
