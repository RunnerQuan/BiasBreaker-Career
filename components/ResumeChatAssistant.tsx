"use client";

import { FormEvent, Fragment, ReactNode, useMemo, useRef, useState } from "react";
import type { AnalysisResponse } from "../lib/analysis";

export type ResumeChatContext = {
  jobTitle?: string;
  jdText?: string;
  resumeText?: string;
  resumeFileName?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ResumeChatAssistantProps = {
  result: AnalysisResponse;
  context?: ResumeChatContext;
};

const quickQuestions = [
  { label: "我最该先改哪三处？", icon: "A" },
  { label: "帮我优化项目经历", icon: "D" },
  { label: "这份简历怎么准备面试？", icon: "M" },
  { label: "哪些建议不能照抄？", icon: "P" }
];

export function ResumeChatAssistant({ result, context }: ResumeChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "你好！我是你的分析追问助手，会基于本次分析报告、岗位 JD 和简历内容回答。你可以问我优先修改哪里、怎么改写经历，或如何准备面试解释。"
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const targetJob = useMemo(() => normalizeTargetJob(context?.jobTitle, result.summary), [context?.jobTitle, result.summary]);
  const hasFullContext = Boolean(context?.jdText?.trim() && context?.resumeText?.trim());

  async function handleSubmit(event?: FormEvent<HTMLFormElement>, overrideQuestion?: string) {
    event?.preventDefault();
    const question = (overrideQuestion || input).trim();
    if (!question || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    queueScrollToBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...context,
          jobTitle: targetJob,
          analysisResult: result,
          messages: nextMessages
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "追问失败，请稍后重试。");
      setMessages((current) => [...current, { role: "assistant", content: normalizeAssistantAnswer(data.answer) || "我暂时没有生成有效回答，请换一种问法。" }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "追问失败，请稍后重试。"
        }
      ]);
    } finally {
      setIsSending(false);
      queueScrollToBottom();
    }
  }

  function queueScrollToBottom() {
    window.setTimeout(() => {
      messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
    }, 40);
  }

  return (
    <aside className="resume-chat-panel" aria-label="分析追问助手">
      <header className="resume-chat-head">
        <div className="resume-chat-title">
          <span>
            <SparkIcon />
          </span>
          <div>
            <h3>分析追问助手</h3>
          </div>
        </div>
        <div className="resume-chat-report">
          <span>当前报告：{targetJob}</span>
          <strong>{result.score}分</strong>
          <b>{levelText(result.level)}</b>
        </div>
      </header>

      <section className="resume-chat-quick" aria-label="快捷追问">
        <p>你可以问我</p>
        <div>
          {quickQuestions.map((item) => (
            <button key={item.label} type="button" onClick={() => void handleSubmit(undefined, item.label)} disabled={isSending}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {!hasFullContext && (
        <p className="resume-chat-context-note">
          这条历史记录创建较早，缺少原始 JD 或简历文本；新完成的分析会在本地保存完整上下文，助手回答会更精准。
        </p>
      )}

      <div className="resume-chat-messages" ref={messagesRef} aria-live="polite">
        {messages.map((message, index) => (
          <article className={`resume-chat-message chat-${message.role}`} key={`${message.role}-${index}`}>
            <span className="resume-chat-avatar">{message.role === "assistant" ? <BotIcon /> : <UserIcon />}</span>
            <div className="resume-chat-md">{renderMarkdown(message.content)}</div>
          </article>
        ))}
        {isSending && (
          <article className="resume-chat-message chat-assistant">
            <span className="resume-chat-avatar"><BotIcon /></span>
            <div className="resume-chat-thinking"><i /><i /><i /></div>
          </article>
        )}
      </div>

      <form className="resume-chat-input" onSubmit={handleSubmit}>
        <input
          value={input}
          maxLength={500}
          onChange={(event) => setInput(event.target.value)}
          placeholder="继续追问本次分析结果，例如：帮我把第二段经历改得更像数据分析岗位"
          aria-label="输入追问内容"
        />
        <button type="submit" disabled={!input.trim() || isSending} aria-label="发送追问">
          <SendIcon />
        </button>
      </form>
      <small className="resume-chat-disclaimer">内容由 AI 生成，仅供参考，请结合真实经历判断。</small>
    </aside>
  );
}

function renderMarkdown(content: string) {
  const normalizedContent = normalizeAssistantAnswer(content)
    .replace(/\s+(?=\d+[.、]\s*\*\*)/g, "\n")
    .replace(/\s+(?=[-*]\s+\*\*)/g, "\n");
  const lines = normalizedContent.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];

  function flushLists() {
    if (listItems.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {listItems.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
    if (orderedItems.length) {
      blocks.push(
        <ol key={`ol-${blocks.length}`}>
          {orderedItems.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}
        </ol>
      );
      orderedItems = [];
    }
  }

  lines.forEach((line) => {
    const unordered = line.match(/^[-*]\s+(.+)/);
    const ordered = line.match(/^\d+[.、]\s*(.+)/);
    if (unordered) {
      orderedItems = [];
      listItems.push(unordered[1]);
      return;
    }
    if (ordered) {
      listItems = [];
      orderedItems.push(ordered[1]);
      return;
    }

    flushLists();
    if (/^#{1,3}\s+/.test(line)) {
      blocks.push(<strong className="resume-chat-md-heading" key={`h-${blocks.length}`}>{renderInlineMarkdown(line.replace(/^#{1,3}\s+/, ""))}</strong>);
    } else if (line.startsWith(">")) {
      blocks.push(<blockquote key={`quote-${blocks.length}`}>{renderInlineMarkdown(line.replace(/^>\s*/, ""))}</blockquote>);
    } else {
      blocks.push(<p key={`p-${blocks.length}`}>{renderInlineMarkdown(line)}</p>);
    }
  });

  flushLists();
  return blocks.length ? blocks : <p>{normalizedContent}</p>;
}

function normalizeAssistantAnswer(value: unknown): string {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/```json|```/g, "").trim();
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleaned) as { answer?: unknown };
      return normalizeAssistantAnswer(parsed.answer);
    } catch {
      const manualAnswer = cleaned.match(/^\{\s*"answer"\s*:\s*"([\s\S]*)"\s*\}\s*$/);
      if (manualAnswer) return normalizeAssistantAnswer(manualAnswer[1]);
    }
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*"answer"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { answer?: unknown };
      const answer = normalizeAssistantAnswer(parsed.answer);
      if (answer) return answer;
    } catch {
      const manualAnswer = jsonMatch[0].match(/\{\s*"answer"\s*:\s*"([\s\S]*)"\s*\}/);
      if (manualAnswer) return normalizeAssistantAnswer(manualAnswer[1]);
    }
  }
  return cleaned
    .replace(/\\([*_`[\]()#>.-])/g, "$1")
    .replace(/\\n/g, "\n")
    .trim();
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function normalizeTargetJob(jobTitle: string | undefined, fallback: string) {
  const cleaned = (jobTitle || "").replace(/\s+/g, " ").trim();
  if (cleaned) return cleaned.slice(0, 26);
  return fallback.slice(0, 26) || "目标岗位";
}

function levelText(level: AnalysisResponse["level"]) {
  if (level === "low") return "低风险";
  if (level === "high") return "高风险";
  return "中等风险";
}

function SparkIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.8 4.2 2.8 6.2 7 7-4.2.8-6.2 2.8-7 7-.8-4.2-2.8-6.2-7-7 4.2-.8 6.2-2.8 7-7Z" /></svg>;
}

function BotIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="8" width="14" height="10" rx="4" /><path d="M12 5v3M9 13h.1M15 13h.1M9 18l-2 2M15 18l2 2" /></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" /></svg>;
}

function SendIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 10 14" /><path d="m21 3-7 18-4-7-7-4 18-7Z" /></svg>;
}
