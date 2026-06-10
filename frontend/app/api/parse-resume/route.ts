import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

const supportedTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown"
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "请上传 DOCX、TXT 或 MD 格式的简历文件。" }, { status: 400 });
  }

  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");

  if (isPdf) {
    return NextResponse.json(
      { message: "PDF 文件应在浏览器中使用 MuPDF 本地解析。" },
      { status: 400 }
    );
  }

  const isSupported =
    supportedTypes.has(file.type) ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md");

  if (!isSupported) {
    return NextResponse.json({ message: "暂仅支持 DOCX、TXT 或 MD 格式的简历文件。" }, { status: 415 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (
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
      return NextResponse.json({ message: "未能从文件中提取到可分析文本。" }, { status: 422 });
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
        message: "简历文件解析失败，请确认文件未损坏。",
        detail: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined
      },
      { status: 422 }
    );
  }
}
