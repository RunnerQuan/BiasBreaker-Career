import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

const supportedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown"
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "请上传 PDF、DOCX 或 TXT 格式的简历文件。" }, { status: 400 });
  }

  const lowerName = file.name.toLowerCase();
  const isSupported =
    supportedTypes.has(file.type) ||
    lowerName.endsWith(".pdf") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md");

  if (!isSupported) {
    return NextResponse.json({ message: "暂仅支持 PDF、DOCX、TXT 或 MD 格式的简历文件。" }, { status: 415 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
      text = await parsePdfText(buffer);
    } else if (
      lowerName.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf-8");
    }

    const normalizedText = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();

    if (!normalizedText) {
      return NextResponse.json({ message: "未能从文件中提取到可分析文本，请检查文件是否为扫描件或受保护文档。" }, { status: 422 });
    }

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      text: normalizedText
    });
  } catch (error) {
    console.error("resume parse failed", error);
    return NextResponse.json(
      {
        message: "简历文件解析失败，请确认文件未加密且内容可复制。",
        detail: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined
      },
      { status: 422 }
    );
  }
}

async function parsePdfText(buffer: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true
  } as unknown as Parameters<typeof pdfjs.getDocument>[0]);
  const document = await loadingTask.promise;

  const pages: string[] = [];
  try {
    for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
      const page = await document.getPage(pageIndex);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
  } finally {
    await document.destroy();
  }

  return pages.join("\n\n");
}
