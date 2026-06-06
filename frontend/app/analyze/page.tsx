"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import type { AnalysisResponse } from "../../lib/analysis";
import { createHistoryRecord, saveHistoryRecord } from "../../lib/history";

type ResumeMode = "upload" | "paste";

const previewItems = [
  { title: "风险报告", desc: "识别潜在偏见与算法可读性风险。", icon: "shield" },
  { title: "改写建议", desc: "提供具体改写建议，提升可读性。", icon: "edit" },
  { title: "复核话术", desc: "生成复核沟通话术，支持合规复核。", icon: "chat" },
  { title: "面试解释", desc: "提炼面试解释要点，辅助面试沟通。", icon: "person" }
];

export default function AnalyzePage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ResumeMode>("upload");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<"idle" | "parsing" | "analyzing">("idle");
  const [error, setError] = useState("");

  const score = result?.score ?? 68;
  const levelLabel = result ? levelText(result.level) : "中等风险";
  const canAnalyze = jdText.trim().length > 0 && (mode === "upload" ? Boolean(resumeFile) : resumeText.trim().length > 0);

  const jdCount = useMemo(() => jdText.length, [jdText]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!canAnalyze) {
      setError("请先填写岗位 JD，并上传简历文件或粘贴简历文本。");
      return;
    }

    setIsLoading(true);
    setAnalysisPhase(mode === "upload" ? "parsing" : "analyzing");
    try {
      const finalResumeText = mode === "upload" ? await parseResumeFile(resumeFile) : resumeText.trim();
      if (!finalResumeText.trim()) {
        throw new Error("未能读取到简历文本，请重新上传文件或切换为粘贴文本。");
      }
      if (mode === "upload") setResumeText(finalResumeText);
      setAnalysisPhase("analyzing");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          jdText,
          resumeText: finalResumeText,
          resumeFileName: fileName
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "分析失败，请稍后重试。");
      setResult(data);
      saveHistoryRecord(
        createHistoryRecord({
          jobTitle,
          resumeFileName: fileName,
          result: data
        })
      );
      setIsResultOpen(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失败，请稍后重试。");
    } finally {
      setIsLoading(false);
      setAnalysisPhase("idle");
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setResumeFile(file);
    setResumeText("");
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
  }

  async function parseResumeFile(file: File | null) {
    if (!file) throw new Error("请先上传 PDF、DOCX、TXT 或 MD 格式的简历文件。");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-resume", {
      method: "POST",
      body: formData
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "简历文件解析失败，请换一个文件或切换为粘贴文本。");
    }

    setFileName(data.fileName);
    setFileSize(formatFileSize(data.fileSize));
    return String(data.text || "");
  }

  return (
    <main className="analyze-page">
      <AnalyzeDecor />
      <AnalyzeNav />

      <section className="analyze-hero" aria-labelledby="analyze-title">
        <h1 id="analyze-title">输入岗位 JD 与简历，开始算法可读性检测</h1>
        <p>基于算法视角识别风险，提供改写建议，提升简历可读性与公平性。</p>
      </section>

      <form className="analysis-workspace" onSubmit={handleSubmit}>
        <section className="analysis-input-panel" aria-labelledby="input-title">
          <h2 id="input-title">
            <span>1</span>
            填写分析内容
          </h2>

          <div className="jd-box">
            <label htmlFor="job-title">
              <MiniDocIcon />
              岗位 JD
            </label>
            <input
              id="job-title"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="请输入岗位名称，如：用户增长实习生"
            />
            <textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              placeholder="请输入岗位 JD（职责、要求等）"
              maxLength={1000}
            />
            <small>{jdCount}/1000</small>
          </div>

          <div className="resume-box">
            <div className="resume-box-head">
              <h3>
                <span>2</span>
                简历上传
              </h3>
              <div className="mode-switch" role="tablist" aria-label="简历输入方式">
                <button type="button" className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}>
                  上传文件
                </button>
                <button type="button" className={mode === "paste" ? "active" : ""} onClick={() => setMode("paste")}>
                  粘贴文本
                </button>
              </div>
            </div>

            {mode === "upload" ? (
              <label className="upload-zone">
                <input type="file" accept=".pdf,.docx,.txt,.md" onChange={handleFileChange} />
                <UploadIcon />
                <strong>{fileName ? "简历已选择，点击开始分析后自动解析" : "点击上传或拖拽文件到此处"}</strong>
                <span>支持 PDF / DOCX / TXT / MD，点击开始分析后将自动解析并调用模型</span>
              </label>
            ) : (
              <textarea
                className="resume-textarea"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder="请粘贴简历文本，建议包含教育背景、项目经历、实习经历和技能。"
              />
            )}

            {fileName && (
              <div className="parsed-file">
                <span className="pdf-icon">{fileName.split(".").pop()?.slice(0, 3).toUpperCase() || "FILE"}</span>
                <div>
                  <strong>{fileName}</strong>
                  <small>{fileSize}</small>
                </div>
                <b />
                <button type="button" onClick={() => { setResumeFile(null); setFileName(""); setFileSize(""); setResumeText(""); }}>
                  移除文件
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="analysis-preview-panel" aria-label="分析结果预览">
          <h2>
            <TrendIcon />
            分析结果预览
          </h2>

          <div className="score-gauge" style={{ "--score": score } as React.CSSProperties}>
            <div>
              <strong>{score}</strong>
              <span>/100</span>
              <small>算法可读性评分</small>
            </div>
          </div>

          <div className="risk-chips">
            <span>{levelLabel}</span>
            <span>改进空间</span>
            <span>建议优化</span>
          </div>

          <div className="preview-list">
            {previewItems.map((item) => (
              <article
                key={item.title}
                role="button"
                tabIndex={0}
                onClick={() => result && setIsResultOpen(true)}
                onKeyDown={(event) => {
                  if (result && (event.key === "Enter" || event.key === " ")) setIsResultOpen(true);
                }}
              >
                <span>
                  <PreviewIcon icon={item.icon} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                <b>›</b>
              </article>
            ))}
          </div>
        </aside>

        {error && <p className="analysis-error">{error}</p>}

        <div className="analysis-actions">
          <button type="submit" className="analysis-primary" disabled={isLoading}>
            <SparkleIcon />
            <span>{analysisPhase === "parsing" ? "解析中..." : analysisPhase === "analyzing" ? "分析中..." : "开始分析"}</span>
            <b>→</b>
          </button>
        </div>
      </form>

      <p className="privacy-note">
        <LockIcon />
        你的数据仅用于分析，不用于模型训练或对外公开，保障隐私安全。
      </p>

      {isLoading && <AnalyzingOverlay phase={analysisPhase} />}
      {result && isResultOpen && <AnalysisResultModal result={result} onClose={() => setIsResultOpen(false)} />}
    </main>
  );
}

function AnalyzeNav() {
  return (
    <header className="analyze-nav">
      <Link href="/" className="analyze-brand">
        <ShieldIcon />
        <span>BiasBreaker Career</span>
      </Link>
      <nav aria-label="主导航">
        <Link href="/#intro">产品介绍</Link>
        <Link href="/#flow">使用流程</Link>
        <Link href="/analyze" className="active">
          简历分析
        </Link>
        <Link href="/history">历史记录</Link>
      </nav>
      <Link href="/analyze" className="analyze-nav-cta">
        <SparkleIcon />
        开始分析
      </Link>
    </header>
  );
}

function AnalyzeDecor() {
  return (
    <div className="analyze-decor" aria-hidden="true">
      <span className="analyze-paperclip" />
      <span className="analyze-grid-note" />
      <span className="analyze-pen" />
      <span className="analyze-clip" />
      <span className="analyze-sticky">更清晰<br />更公平<br />更有机会</span>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function levelText(level: AnalysisResponse["level"]) {
  if (level === "low") return "低风险";
  if (level === "high") return "高风险";
  return "中等风险";
}

function sourceText(source: "jd" | "resume" | "system") {
  if (source === "jd") return "岗位 JD";
  if (source === "resume") return "简历";
  return "系统判断";
}

function AnalyzingOverlay({ phase }: { phase: "idle" | "parsing" | "analyzing" }) {
  const steps =
    phase === "parsing"
      ? ["读取简历文件", "恢复文本结构", "清洗段落与项目符号", "准备模型分析"]
      : ["解析岗位要求", "比对简历证据", "识别可读性风险", "生成改写与复核话术"];

  return (
    <div className="analysis-loading-overlay" role="status" aria-live="polite">
      <div className="analysis-loading-card">
        <div className="analysis-orbit">
          <span />
          <span />
          <span />
        </div>
        <strong>{phase === "parsing" ? "正在解析简历" : "系统正在分析"}</strong>
        <p>{phase === "parsing" ? "正在提取简历正文并整理结构，随后将自动进入模型分析。" : "正在调用模型理解 JD 与简历内容，请稍等片刻。"}</p>
        <div>
          {steps.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalysisResultModal({ result, onClose }: { result: AnalysisResponse; onClose: () => void }) {
  return (
    <div className="analysis-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="analysis-modal" role="dialog" aria-modal="true" aria-labelledby="analysis-result-title" onClick={(event) => event.stopPropagation()}>
        <header className="analysis-modal-head">
          <div>
            <span>{result.providerMode === "llm" ? "模型分析结果" : "规则分析结果"}</span>
            <h2 id="analysis-result-title">算法可读性完整报告</h2>
            <p>{result.summary}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭分析结果">
            ×
          </button>
        </header>

        <div className="analysis-modal-score">
          <div>
            <strong>{result.score}</strong>
            <span>/100</span>
            <small>{levelText(result.level)}</small>
          </div>
          <p>生成时间：{new Date(result.createdAt).toLocaleString("zh-CN")}</p>
        </div>

        <div className="analysis-report-layout">
          <aside className="analysis-report-side">
            <section className="analysis-modal-card">
            <h3>维度评分</h3>
            <div className="dimension-list">
              {result.dimensions.map((dimension) => (
                <article key={dimension.key}>
                  <div>
                    <strong>{dimension.label}</strong>
                    <span>{dimension.score}</span>
                  </div>
                  <i style={{ "--value": dimension.score } as React.CSSProperties} />
                  <p>{dimension.summary}</p>
                </article>
              ))}
            </div>
          </section>

            {result.semanticMatch && (
              <section className="analysis-modal-card semantic-card">
                <h3>语义匹配</h3>
                <strong>{result.semanticMatch.score}</strong>
                <p>{result.semanticMatch.summary}</p>
                <ul>
                  {result.semanticMatch.topEvidence.slice(0, 2).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </aside>

          <div className="analysis-report-main">
            <section className="analysis-modal-card priority-card">
              <h3>优先处理的问题</h3>
              <div className="priority-list">
                {result.findings.slice(0, 3).map((finding, index) => (
                  <article key={`${finding.type}-priority-${index}`}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{finding.type}</strong>
                      <p>{finding.suggestion}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="analysis-modal-card">
              <h3>风险报告与证据引用</h3>
            <div className="finding-list">
              {result.findings.map((finding, index) => (
                <article key={`${finding.type}-${index}`}>
                  <div>
                    <strong>{finding.type}</strong>
                    <span className={`severity severity-${finding.severity}`}>{levelText(finding.severity)}</span>
                  </div>
                  <small>{sourceText(finding.source)}</small>
                  <blockquote>{finding.evidence}</blockquote>
                  <p>{finding.suggestion}</p>
                </article>
              ))}
            </div>
          </section>

            <section className="analysis-modal-card">
              <h3>改写建议</h3>
            <div className="suggestion-list">
              {result.suggestions.map((suggestion) => (
                <article key={suggestion.title}>
                  <strong>{suggestion.title}</strong>
                  <p>{suggestion.description}</p>
                  <em>{suggestion.example}</em>
                </article>
              ))}
            </div>
          </section>

            <section className="analysis-modal-card">
              <h3>复核话术与面试解释</h3>
            <div className="script-list">
              <article>
                <strong>人工复核话术</strong>
                <p>{result.reviewScripts.manualReview}</p>
              </article>
              <article>
                <strong>面试解释</strong>
                <p>{result.reviewScripts.interviewExplanation}</p>
              </article>
            </div>
          </section>
          </div>
        </div>
      </section>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="32" height="36" viewBox="0 0 28 32" fill="none" aria-hidden="true">
      <path d="M14 1.7c4.3 2.8 8.1 3.6 11.6 3.4.1 10.7-3.7 18.5-11.6 24.8C6.1 23.6 2.3 15.8 2.4 5.1 5.9 5.3 9.7 4.5 14 1.7Z" fill="url(#analyzeShield)" />
      <path d="m14 9.2 1.55 3.15 3.48.5-2.52 2.45.6 3.46L14 17.13l-3.11 1.63.6-3.46-2.52-2.45 3.48-.5L14 9.2Z" fill="white" />
      <defs>
        <linearGradient id="analyzeShield" x1="5" y1="3" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffb39d" />
          <stop offset=".55" stopColor="#ff767a" />
          <stop offset="1" stopColor="#e85574" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.8c.8 4 2.5 5.7 6.5 6.5-4 .8-5.7 2.5-6.5 6.5-.8-4-2.5-5.7-6.5-6.5 4-.8 5.7-2.5 6.5-6.5Z" fill="currentColor" />
    </svg>
  );
}

function MiniDocIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v5h5M9 12h4" />
      <circle cx="15" cy="16" r="2.5" />
      <path d="m17 18 2.5 2.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 15V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 15.5a4 4 0 0 0 .6 0A5 5 0 0 1 15 9.5a4.5 4.5 0 1 1 1.5 9.7H8" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m4 16 5-5 4 4 7-8" />
      <path d="M16 7h4v4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function PreviewIcon({ icon }: { icon: string }) {
  const common = { width: 32, height: 32, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  return (
    <svg {...common} aria-hidden="true">
      {icon === "shield" && <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" />}
      {icon === "edit" && <path d="M4 20h5L20 9l-5-5L4 15zM13 6l5 5" />}
      {icon === "chat" && <path d="M4 6h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />}
      {icon === "person" && <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />}
    </svg>
  );
}
