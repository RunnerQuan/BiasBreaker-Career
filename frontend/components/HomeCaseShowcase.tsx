"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

const cases = [
  {
    index: "01",
    title: "校园经历被算法忽略",
    original: "负责学院公众号和活动宣传。",
    risks: ["校园宣传", "社团经历", "非正式工作经历"],
    riskText: "系统可能无法识别内容运营、用户触达、活动转化与协作能力。",
    rewritten: (
      <>
        负责学院公众号<span>内容运营</span>与校园<span>活动传播</span>，完成<span>选题策划</span>、内容发布、报名信息整理和活动反馈<span>复盘</span>，协同多个学生组织推进活动落地。
      </>
    ),
    abilities: ["内容运营", "活动传播", "反馈复盘", "协同推进"],
    value: "让校园经历被准确理解与匹配"
  },
  {
    index: "02",
    title: "跨专业经历被误判",
    original: "参与社会调查，完成问卷和访谈。",
    risks: ["学术研究", "专业不匹配", "相关性不明确"],
    riskText: "系统可能忽略其中与岗位相关的可迁移能力，低估真实价值。",
    rewritten: (
      <>
        参与青年就业主题<span>用户研究</span>，负责<span>问卷设计</span>、半结构化<span>访谈</span>、样本整理与结果分析，并输出用户需求与行为特征报告。
      </>
    ),
    abilities: ["用户研究", "问卷设计", "访谈分析", "洞察提炼"],
    value: "让跨专业经历被看见、被认可、被匹配"
  }
];

export function HomeCaseShowcase() {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (pathname !== "/") {
      setHost(null);
      return;
    }

    let cancelled = false;
    let mountedHost: HTMLElement | null = null;
    const timers: number[] = [];

    const attach = () => {
      if (cancelled) return;
      const home = document.querySelector<HTMLElement>(".snap-home");
      const usageSection = home?.querySelector<HTMLElement>("#flow");
      if (!home || !usageSection) return;

      const existing = home.querySelector<HTMLElement>(".home-case-portal");
      mountedHost = existing ?? document.createElement("div");
      if (!existing) {
        mountedHost.className = "home-case-portal";
        home.insertBefore(mountedHost, usageSection);
      }
      setHost(mountedHost);
    };

    attach();
    timers.push(window.setTimeout(attach, 60));
    timers.push(window.setTimeout(attach, 180));
    timers.push(window.setTimeout(attach, 420));

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      if (mountedHost?.isConnected) mountedHost.remove();
      setHost(null);
    };
  }, [pathname]);

  if (!host || pathname !== "/") return null;

  const enter = (delay = 0) => ({
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const }
  });

  return createPortal(
    <section id="cases" className="case-showcase snap-section" aria-labelledby="case-showcase-title">
      <div className="case-glow case-glow-coral" aria-hidden="true" />
      <div className="case-glow case-glow-aqua" aria-hidden="true" />
      <span className="case-paperclip case-paperclip-left" aria-hidden="true"><span className="paperclip-shape" /></span>
      <span className="case-paperclip case-paperclip-right" aria-hidden="true"><span className="paperclip-shape" /></span>

      <div className="case-showcase-content">
        <motion.div className="case-heading" {...enter(0.02)}>
          <span className="case-kicker"><b>案例展示</b><i /><strong>Case Studies</strong></span>
          <h2 id="case-showcase-title">真实案例：当能力存在，却没有被系统<span>正确识别</span></h2>
          <p>识别简历在招聘算法中的可读性风险，把已有经历转译成更容易被 ATS 与 HR 理解的表达。</p>
        </motion.div>

        <div className="case-grid">
          {cases.map((item, index) => (
            <motion.article className="case-card" key={item.index} {...enter(0.08 + index * 0.07)}>
              <header className="case-card-head"><div><b>{item.index}</b><h3>{item.title}</h3></div><span>⚠ 算法误读风险</span></header>
              <div className="case-original-block"><i aria-hidden="true">▤</i><div><strong>原始表达</strong><p>{item.original}</p></div></div>
              <div className="case-misread-flow" aria-label="系统可能误读">
                <div className="case-arrow" aria-hidden="true">↓</div>
                <div className="case-misread-copy"><strong>系统可能误读</strong><p>{item.riskText}</p><div className="case-risk-tags">{item.risks.map((risk) => <span key={risk}>{risk}</span>)}</div></div>
              </div>
              <div className="case-rewrite-block"><i aria-hidden="true">✦</i><div><strong>改写后（更容易被识别）</strong><p className="case-rewrite-copy">{item.rewritten}</p><div className="case-ability-tags">{item.abilities.map((ability) => <span key={ability}>✓ {ability}</span>)}</div></div></div>
              <footer>♢ 真实能力显性化：{item.value}</footer>
            </motion.article>
          ))}
        </div>
      </div>
    </section>,
    host
  );
}
