"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "../../components/AppNav";
import { AnalysisResultModal } from "../../components/AnalysisResultModal";
import type { RiskLevel } from "../../lib/analysis";
import {
  buildReportMarkdown,
  deleteHistoryRecords,
  formatHistoryTime,
  levelText,
  readHistoryRecords,
  type HistoryRecord
} from "../../lib/history";

type FilterType = "all" | "recent" | RiskLevel;
type SortType = "timeDesc" | "scoreDesc" | "scoreAsc";

const pageSize = 5;

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("timeDesc");
  const [page, setPage] = useState(1);
  const [activeRecord, setActiveRecord] = useState<HistoryRecord | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  useEffect(() => {
    setRecords(readHistoryRecords());
  }, []);

  const filteredRecords = useMemo(() => {
    const now = Date.now();
    const normalizedQuery = query.trim().toLowerCase();

    return records
      .filter((record) => {
        const matchesQuery =
          !normalizedQuery ||
          record.candidateName.toLowerCase().includes(normalizedQuery) ||
          record.targetJob.toLowerCase().includes(normalizedQuery);
        const matchesFilter =
          filter === "all" ||
          (filter === "recent" && now - Date.parse(record.createdAt) <= 7 * 24 * 60 * 60 * 1000) ||
          record.result.level === filter;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "scoreDesc") return b.result.score - a.result.score;
        if (sort === "scoreAsc") return a.result.score - b.result.score;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
  }, [filter, query, records, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageIds = pageRecords.map((record) => record.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const overview = useMemo(() => createOverview(records), [records]);

  function refreshRecords() {
    setRecords(readHistoryRecords());
    setSelectedIds([]);
    setPage(1);
  }

  function handleDelete(ids: string[]) {
    if (!ids.length) return;
    deleteHistoryRecords(ids);
    refreshRecords();
    if (activeRecord && ids.includes(activeRecord.id)) setActiveRecord(null);
  }

  function requestDelete(ids: string[]) {
    if (!ids.length) return;
    setPendingDeleteIds(ids);
  }

  function confirmDelete() {
    handleDelete(pendingDeleteIds);
    setPendingDeleteIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function togglePageSelected() {
    setSelectedIds((current) => {
      if (allPageSelected) return current.filter((id) => !pageIds.includes(id));
      return [...new Set([...current, ...pageIds])];
    });
  }

  return (
    <main className="history-page">
      <HistoryDecor />
      <AppNav active="history" />

      <section className="history-hero">
        <h1>查看你的历史分析记录</h1>
        <p>统一管理历次简历检测结果，快速回看评分、报告与改写建议。</p>
      </section>

      <section className="history-layout" aria-label="历史分析记录">
        <div className="history-table-card">
          <div className="history-toolbar">
            <label className="history-search">
              <SearchIcon />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="搜索姓名、岗位名称" />
            </label>
            <button className="history-batch-delete" type="button" onClick={() => requestDelete(selectedIds)} disabled={!selectedIds.length}>
              <TrashIcon />
              批量删除
            </button>
            <div className="history-filters">
              {[
                ["all", "全部"],
                ["recent", "最近7天"],
                ["high", "高风险"],
                ["medium", "中等风险"],
                ["low", "低风险"]
              ].map(([value, label]) => (
                <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => { setFilter(value as FilterType); setPage(1); }}>
                  {label}
                </button>
              ))}
            </div>
            <select className="history-sort" value={sort} onChange={(event) => setSort(event.target.value as SortType)} aria-label="排序方式">
              <option value="timeDesc">按时间排序</option>
              <option value="scoreDesc">评分从高到低</option>
              <option value="scoreAsc">评分从低到高</option>
            </select>
          </div>

          <div className="history-table">
            <div className="history-table-head">
              <label><input type="checkbox" checked={allPageSelected} onChange={togglePageSelected} /></label>
              <span>候选人</span>
              <span>目标岗位</span>
              <span>综合评分</span>
              <span>风险等级</span>
              <span>分析时间</span>
              <span>操作</span>
            </div>

            {pageRecords.length ? (
              pageRecords.map((record, index) => (
                <article className="history-row" key={record.id}>
                  <label><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleSelected(record.id)} /></label>
                  <div className="history-person">
                    <span className={`history-avatar avatar-${index % 4}`}>{record.candidateName.slice(0, 1)}</span>
                    <strong>{record.candidateName}</strong>
                  </div>
                  <span className="history-job" title={record.targetJob}>{record.targetJob}</span>
                  <span className={`history-score score-${record.result.level}`}>{record.result.score}<small>/100</small></span>
                  <span className={`history-risk risk-${record.result.level}`}>{levelText(record.result.level)}</span>
                  <span className="history-time">{formatHistoryTime(record.createdAt)}</span>
                  <div className="history-actions">
                    <button type="button" onClick={() => setActiveRecord(record)}>查看报告</button>
                    <button type="button" aria-label="下载报告" onClick={() => downloadRecord(record)}><DownloadIcon /></button>
                    <button type="button" onClick={() => requestDelete([record.id])}><TrashIcon />删除</button>
                  </div>
                </article>
              ))
            ) : (
              <div className="history-empty">
                <strong>暂无历史记录</strong>
                <p>完成一次简历分析后，系统会自动把报告保存在本机浏览器中。</p>
                <Link href="/analyze">开始分析</Link>
              </div>
            )}
          </div>

          <div className="history-pagination">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>
            {Array.from({ length: totalPages }).slice(0, 3).map((_, index) => (
              <button key={index + 1} type="button" className={currentPage === index + 1 ? "active" : ""} onClick={() => setPage(index + 1)}>{index + 1}</button>
            ))}
            {totalPages > 3 && <span>…</span>}
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>›</button>
            <p>共 {filteredRecords.length} 条记录</p>
          </div>
        </div>

        <aside className="history-side">
          <section className="history-overview">
            <h2><TrendIcon />记录概览</h2>
            <div>
              <StatCard label="总记录" value={records.length} tone="red" />
              <StatCard label="最近7天" value={overview.recent} tone="cyan" />
              <StatCard label="平均评分" value={overview.average} tone="cyan" />
              <StatCard label="高风险记录" value={overview.high} tone="red" />
            </div>
          </section>

          <section className="history-advice">
            <h2><LightIcon />使用建议</h2>
            <p>定期回顾历史记录，对比不同版本的分析结果，持续优化简历质量，降低偏见风险，提升通过率。</p>
            <span className="history-checklist" />
          </section>
        </aside>
      </section>

      {activeRecord && (
        <AnalysisResultModal
          result={activeRecord.result}
          onClose={() => setActiveRecord(null)}
          title={`${activeRecord.candidateName} 的分析报告`}
          subtitle={`${activeRecord.targetJob} · ${activeRecord.result.summary}`}
          createdAtLabel={`生成时间：${formatHistoryTime(activeRecord.createdAt)}`}
          chatContext={{
            jobTitle: activeRecord.targetJob,
            jdText: activeRecord.jdText,
            resumeText: activeRecord.resumeText,
            resumeFileName: activeRecord.resumeFileName
          }}
        />
      )}
      {pendingDeleteIds.length > 0 && (
        <ConfirmDeleteDialog count={pendingDeleteIds.length} onCancel={() => setPendingDeleteIds([])} onConfirm={confirmDelete} />
      )}
    </main>
  );
}

function ConfirmDeleteDialog({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="analysis-modal-backdrop confirm-backdrop" role="presentation" onClick={onCancel}>
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title" onClick={(event) => event.stopPropagation()}>
        <span className="confirm-icon"><TrashIcon /></span>
        <h2 id="confirm-delete-title">确认删除历史记录？</h2>
        <p>将删除选中的 {count} 条分析记录。删除后无法恢复，但不会影响你本地的原始简历文件。</p>
        <div><button type="button" onClick={onCancel}>取消</button><button type="button" onClick={onConfirm}>确认删除</button></div>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "red" | "cyan" }) {
  return <article className={`history-stat stat-${tone}`}><span>{label}</span><strong>{value}</strong></article>;
}

function createOverview(records: HistoryRecord[]) {
  const now = Date.now();
  const recent = records.filter((record) => now - Date.parse(record.createdAt) <= 7 * 24 * 60 * 60 * 1000).length;
  const high = records.filter((record) => record.result.level === "high").length;
  const average = records.length ? Math.round(records.reduce((sum, record) => sum + record.result.score, 0) / records.length) : 0;
  return { recent, high, average };
}

function downloadRecord(record: HistoryRecord) {
  const blob = new Blob([buildReportMarkdown(record)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${record.candidateName}-${record.targetJob}-分析报告.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function HistoryDecor() {
  return (
    <div className="history-decor" aria-hidden="true">
      <span className="analyze-paperclip" />
      <span className="analyze-grid-note" />
      <span className="analyze-pen" />
      <span className="analyze-clip" />
      <span className="history-sticky">客观分析<br />精准优化<br />更有机会</span>
    </div>
  );
}

function SearchIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>; }
function TrashIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>; }
function DownloadIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>; }
function TrendIcon() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 16 5-5 4 4 7-8" /><path d="M16 7h4v4" /></svg>; }
function LightIcon() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-.8.7-1.2 1.4-1.2 2H9.2c0-.6-.4-1.3-1.2-2Z" /></svg>; }
