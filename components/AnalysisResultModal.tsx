"use client";

import { useEffect } from "react";
import { DimensionRadar } from "./DimensionRadar";
import { ResumeChatAssistant, type ResumeChatContext } from "./ResumeChatAssistant";
import type { AnalysisResponse, RiskLevel } from "../lib/analysis";

type AnalysisResultModalProps = {
  result: AnalysisResponse;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  createdAtLabel?: string;
  chatContext?: ResumeChatContext;
};

export function AnalysisResultModal({ result, onClose, title = "算法可读性完整报告", subtitle, createdAtLabel, chatContext }: AnalysisResultModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="analysis-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="analysis-modal" role="dialog" aria-modal="true" aria-labelledby="shared-analysis-result-title" onClick={(event) => event.stopPropagation()}>
        <style jsx global>{reportStyles}</style>
        <button className="analysis-modal-close" type="button" onClick={onClose} aria-label="关闭分析结果">×</button>
        <div className="analysis-modal-shell">
          <div className="analysis-report-content">
            <header className="analysis-modal-head">
              <div>
                <span>{result.providerMode === "llm" ? "模型分析结果" : "规则分析结果"}</span>
                <h2 id="shared-analysis-result-title">{title}</h2>
                <p>{subtitle || result.summary}</p>
              </div>
            </header>

            <div className="analysis-modal-score">
              <div>
                <strong>{result.score}</strong>
                <span>/100</span>
                <small>{levelText(result.level)}</small>
              </div>
              <p>{createdAtLabel || `生成时间：${new Date(result.createdAt).toLocaleString("zh-CN")}`}</p>
            </div>

            <div className="analysis-report-layout">
              <aside className="analysis-report-side">
                <section className="analysis-modal-card">
                  <h3>维度评分</h3>
                  <DimensionRadar dimensions={result.dimensions} />
                  <p className="dimension-help">系统可读性（ATS）衡量招聘系统能否顺利读取简历文本、栏目结构和关键信息。</p>
                  <div className="dimension-list">
                    {result.dimensions.map((dimension) => (
                      <article key={dimension.key}>
                        <div>
                          <strong>{dimensionLabel(dimension.label)}</strong>
                          <span>{dimension.score}</span>
                        </div>
                        <i style={{ "--value": dimension.score } as React.CSSProperties} />
                        <p>{dimensionSummary(dimension)}</p>
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
                      {result.semanticMatch.topEvidence.slice(0, 2).map((item, index) => <li key={index}>{item}</li>)}
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
                        <div><strong>{finding.type}</strong><p>{finding.suggestion}</p></div>
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

                <section className="analysis-modal-card rewrite-card">
                  <div className="rewrite-section-head">
                    <div>
                      <h3>原句风险与改写建议</h3>
                      <p>证据约束改写：不编造经历，只把已有表达转译成 ATS 与 HR 更容易识别的岗位语言。</p>
                    </div>
                    <span>共 {result.suggestions.length} 条建议</span>
                  </div>
                  <div className="rewrite-suggestion-list">
                    {result.suggestions.map((suggestion, index) => {
                      const severity = suggestion.severity ?? "medium";
                      const original = suggestion.original || "未定位到完整原句，请结合上方风险证据核对原文。";
                      const risk = suggestion.risk || suggestion.description;
                      const rewritten = suggestion.rewritten || suggestion.example;
                      const reason = suggestion.reason || suggestion.description;
                      return (
                        <article className={`rewrite-suggestion-card rewrite-${severity}`} key={`${suggestion.title}-${index}`}>
                          <aside className="rewrite-risk-rail">
                            <b><RiskLevelIcon level={severity} /></b>
                            <span>{levelText(severity)}</span>
                            <strong>{suggestion.title}</strong>
                          </aside>
                          <div className="rewrite-content">
                            <div className="rewrite-title-row">
                              <strong>建议 {index + 1}</strong>
                              <button type="button" onClick={() => void navigator.clipboard?.writeText(rewritten)}>复制改写后</button>
                            </div>
                            <div className="rewrite-compare-grid">
                              <div className="rewrite-box rewrite-original"><small>原句</small><p>{original}</p></div>
                              <div className="rewrite-box rewrite-after"><small>改写后（参考表达）</small><p>{rewritten}</p></div>
                            </div>
                            <div className="rewrite-risk-box">
                              <span className="rewrite-info-icon"><RiskInfoIcon /></span>
                              <div><strong>风险说明</strong>{risk}</div>
                            </div>
                            <div className="rewrite-reason-box">
                              <span className="rewrite-info-icon"><RewriteReasonIcon /></span>
                              <div><strong>改写理由</strong>{reason}</div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="rewrite-note">💡 请根据真实经历选择合适表达；如缺少具体数据，用 [待确认] 补充，避免过度包装。</div>
                </section>

                <section className="analysis-modal-card">
                  <h3>复核话术与面试解释</h3>
                  <div className="script-list">
                    <article><strong>人工复核话术</strong><p>{result.reviewScripts.manualReview}</p></article>
                    <article><strong>面试解释</strong><p>{result.reviewScripts.interviewExplanation}</p></article>
                  </div>
                </section>
              </div>
            </div>
          </div>
          <ResumeChatAssistant result={result} context={chatContext} />
        </div>
      </section>
    </div>
  );
}

function RiskLevelIcon({ level }: { level: RiskLevel }) {
  if (level === "high") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17.2v.2" /></svg>;
  }
  if (level === "low") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.2" /></svg>;
}

function RiskInfoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3.5 6.8v5.4c0 4.4 3.2 7.2 8.5 9.8 5.3-2.6 8.5-5.4 8.5-9.8V6.8L12 3Z" /><path d="M12 8v5M12 16.2v.2" /></svg>;
}

function RewriteReasonIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h5L20 9l-5-5L4 15v5Z" /><path d="m13 6 5 5M4 20l4-4" /></svg>;
}

function levelText(level: RiskLevel) {
  if (level === "low") return "低风险";
  if (level === "high") return "高风险";
  return "中等风险";
}

function sourceText(source: "jd" | "resume" | "system") {
  if (source === "jd") return "岗位 JD";
  if (source === "resume") return "简历";
  return "系统判断";
}

function dimensionLabel(label: string) {
  return label === "ATS 可读性" ? "系统可读性（ATS）" : label;
}

function dimensionSummary(dimension: AnalysisResponse["dimensions"][number]) {
  if (dimension.key !== "atsReadability") return dimension.summary;
  return `${dimension.summary}。ATS 指招聘系统自动读取简历的能力，重点看格式、文本可复制性和栏目是否容易被系统识别。`;
}

const reportStyles = `
.rewrite-card{background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(255,255,255,.58)),radial-gradient(circle at 0 0,rgba(255,83,92,.1),transparent 34%),radial-gradient(circle at 100% 100%,rgba(85,200,207,.15),transparent 38%)}
.rewrite-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.rewrite-section-head h3{margin:0}.rewrite-section-head p{margin:8px 0 0;color:#61708a;font-size:14px;font-weight:650;line-height:1.65}.rewrite-section-head>span{flex:0 0 auto;padding:8px 12px;border-radius:999px;color:#0caeb9;font-size:13px;font-weight:900;background:rgba(85,200,207,.11)}
.rewrite-suggestion-list{display:grid;gap:16px}.rewrite-suggestion-card{display:grid;grid-template-columns:112px 1fr;overflow:hidden;padding:0;border:1px solid rgba(255,83,92,.14);border-radius:22px;background:rgba(255,255,255,.72);box-shadow:0 18px 40px rgba(23,42,69,.06)}.rewrite-suggestion-card.rewrite-medium{border-color:rgba(255,153,43,.22)}.rewrite-suggestion-card.rewrite-low{border-color:rgba(53,199,119,.22)}
.rewrite-risk-rail{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px 12px;text-align:center;background:linear-gradient(180deg,rgba(255,83,92,.12),rgba(255,83,92,.04))}.rewrite-medium .rewrite-risk-rail{background:linear-gradient(180deg,rgba(255,153,43,.14),rgba(255,153,43,.04))}.rewrite-low .rewrite-risk-rail{background:linear-gradient(180deg,rgba(53,199,119,.13),rgba(53,199,119,.04))}
.rewrite-risk-rail b{display:grid;place-items:center;width:44px;height:44px;border-radius:16px;color:#ff535c;background:rgba(255,255,255,.78);box-shadow:0 12px 26px rgba(255,83,92,.12)}.rewrite-risk-rail b svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.rewrite-medium .rewrite-risk-rail b{color:#ff8a00}.rewrite-low .rewrite-risk-rail b{color:#0ca66f}.rewrite-risk-rail strong{color:var(--ink);font-size:15px;font-weight:900;line-height:1.45}.rewrite-risk-rail span{padding:6px 10px;border-radius:999px;color:#fff;font-size:12px;font-weight:900;background:#ff535c}.rewrite-medium .rewrite-risk-rail span{background:#ff8a00}.rewrite-low .rewrite-risk-rail span{background:#35c777}
.rewrite-content{padding:18px}.rewrite-title-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.rewrite-title-row strong{color:var(--ink);font-size:17px;font-weight:900}.rewrite-title-row button{border:1px solid rgba(123,138,163,.18);border-radius:999px;padding:8px 12px;color:#31435d;font-weight:850;background:rgba(255,255,255,.78);cursor:pointer}.rewrite-compare-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}.rewrite-box{padding:14px;border-radius:16px;line-height:1.7}.rewrite-box small{display:inline-flex;margin-bottom:8px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:900}.rewrite-box p{margin:0;color:#263850;font-size:14px;font-weight:700}.rewrite-original{border:1px solid rgba(255,83,92,.16);background:rgba(255,83,92,.055)}.rewrite-original small{color:#ff535c;background:rgba(255,83,92,.1)}.rewrite-after{border:1px solid rgba(85,200,207,.2);background:rgba(85,200,207,.08)}.rewrite-after small{color:#0caeb9;background:rgba(85,200,207,.15)}
.rewrite-risk-box,.rewrite-reason-box{display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:start;margin-top:12px;padding:12px 14px;border-radius:15px;color:#51637d;font-size:13px;font-weight:700;line-height:1.65}.rewrite-risk-box{border:1px solid rgba(255,83,92,.13);background:rgba(255,83,92,.045)}.rewrite-reason-box{border:1px solid rgba(85,200,207,.16);background:rgba(85,200,207,.065)}.rewrite-info-icon{display:grid;place-items:center;width:32px;height:32px;border-radius:11px;color:#ff535c;background:rgba(255,255,255,.75)}.rewrite-reason-box .rewrite-info-icon{color:#0caeb9}.rewrite-info-icon svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.rewrite-risk-box strong,.rewrite-reason-box strong{display:block;margin-bottom:2px;color:var(--ink);font-weight:900}.rewrite-note{display:flex;gap:8px;align-items:center;margin-top:16px;padding:10px 12px;border-radius:14px;color:#59708d;font-size:13px;font-weight:700;background:rgba(85,200,207,.08)}
@media(max-width:920px){.rewrite-suggestion-card{grid-template-columns:1fr}.rewrite-risk-rail{flex-direction:row;justify-content:flex-start;text-align:left}.rewrite-compare-grid{grid-template-columns:1fr}}
`;
