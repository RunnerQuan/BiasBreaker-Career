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
      pages.push(reconstructPdfPageText(content.items));
    }
  } finally {
    await document.destroy();
  }

  return normalizeExtractedResumeText(pages.join("\n\n"));
}

type PdfTextLikeItem = {
  str?: unknown;
  width?: unknown;
  height?: unknown;
  transform?: unknown;
};

type PositionedText = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type TextLine = {
  y: number;
  height: number;
  items: PositionedText[];
};

function reconstructPdfPageText(rawItems: unknown[]) {
  const items = rawItems
    .map(toPositionedText)
    .filter((item): item is PositionedText => Boolean(item && item.text.trim()))
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const lines = groupItemsIntoLines(items);
  return lines.map(renderLine).filter(Boolean).join("\n");
}

function toPositionedText(item: unknown): PositionedText | null {
  const typed = item as PdfTextLikeItem;
  if (typeof typed.str !== "string" || !Array.isArray(typed.transform)) return null;

  const transform = typed.transform;
  const x = Number(transform[4]);
  const y = Number(transform[5]);
  const width = Number(typed.width ?? 0);
  const height = Number(typed.height ?? Math.abs(Number(transform[3] ?? 10)));

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return {
    text: typed.str,
    x,
    y,
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) && height > 0 ? height : 10
  };
}

function groupItemsIntoLines(items: PositionedText[]) {
  const lines: TextLine[] = [];

  for (const item of items) {
    const tolerance = Math.max(2.4, item.height * 0.35);
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);

    if (line) {
      line.items.push(item);
      line.y = (line.y * (line.items.length - 1) + item.y) / line.items.length;
      line.height = Math.max(line.height, item.height);
    } else {
      lines.push({ y: item.y, height: item.height, items: [item] });
    }
  }

  return lines.sort((a, b) => b.y - a.y);
}

function renderLine(line: TextLine) {
  const items = line.items.sort((a, b) => a.x - b.x);
  let output = "";
  let previous: PositionedText | null = null;

  for (const item of items) {
    const text = item.text.trim();
    if (!text) continue;

    if (!previous) {
      output += text;
      previous = item;
      continue;
    }

    const previousEnd = previous.x + previous.width;
    const gap = item.x - previousEnd;
    const shouldInsertSpace = gap > Math.max(2.8, line.height * 0.28);
    output += shouldInsertSpace ? ` ${text}` : text;
    previous = item;
  }

  return normalizeResumeLine(output);
}

function normalizeExtractedResumeText(text: string) {
  const lines = text
    .split("\n")
    .map(normalizeResumeLine)
    .map((line) => line.replace(/^([·•])\s*/, "• "))
    .filter(Boolean)
    .join("\n");

  return mergeWrappedResumeLines(lines)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeResumeLine(line: string) {
  return line
    .replace(/\s+/g, " ")
    .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    .replace(/([0-9])\s+([0-9])/g, "$1$2")
    .replace(/([0-9])\s*\.\s*([0-9])/g, "$1.$2")
    .replace(/\s+([，。、；：？！）》】])/g, "$1")
    .replace(/([《【（])\s+/g, "$1")
    .replace(/([：；，。])\s*([·•])/g, "$1\n$2")
    .replace(/\s*([—–-])\s*/g, "$1")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+([%)）])/g, "$1")
    .replace(/([(（])\s+/g, "$1")
    .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeWrappedResumeLines(text: string) {
  const sectionHeadings = new Set([
    "教育背景",
    "科研经历",
    "实习经历",
    "项目经历",
    "校园经历",
    "证书",
    "求职意向与个人总结",
    "个人荣誉"
  ]);
  const lines = text.split("\n");
  const merged: string[] = [];

  for (const line of lines) {
    const previous = merged[merged.length - 1];
    if (previous && shouldMergeWrappedLine(previous, line, sectionHeadings)) {
      const separator = /[A-Za-z0-9]$/.test(previous) && /^[\u4e00-\u9fff]/.test(line) ? " " : "";
      merged[merged.length - 1] = normalizeResumeLine(`${previous}${separator}${line}`);
    } else {
      merged.push(line);
    }
  }

  return merged.join("\n");
}

function shouldMergeWrappedLine(previous: string, current: string, sectionHeadings: Set<string>) {
  if (!previous || !current) return false;
  if (sectionHeadings.has(previous) || sectionHeadings.has(current)) return false;
  if (/^(个人荣誉|教育背景|科研经历|实习经历|项目经历|校园经历|证书|求职意向与个人总结)[:：]?/.test(current)) return false;
  if (/^[•·]/.test(current)) return false;
  if (/^\S+[:：].*\d{4}\.\d{2}/.test(current)) return false;
  if (/[。；;！？!?：:]$/.test(previous)) return false;
  if (previous.length < 18) return false;
  return /[\u4e00-\u9fffA-Za-z0-9，、）)]$/.test(previous) && /^[\u4e00-\u9fffA-Za-z0-9（(]/.test(current);
}
