"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

const navItems = [
  { label: "产品介绍", href: "#intro" },
  { label: "使用流程", href: "#flow" },
  { label: "简历分析", href: "/analyze" },
  { label: "历史记录", href: "/history" }
];

const metrics = [
  { label: "关键词覆盖", value: 72, x: 100, y: 28 },
  { label: "结构清晰度", value: 65, x: 168, y: 100 },
  { label: "成就可量化", value: 60, x: 100, y: 164 },
  { label: "表达流畅度", value: 75, x: 32, y: 100 }
];

const actions = [
  { label: "JD 解析", icon: "doc", tone: "cyan" },
  { label: "风险检测", icon: "shield", tone: "amber" },
  { label: "改写建议", icon: "edit", tone: "violet" },
  { label: "复核话术", icon: "chat", tone: "rose" }
];

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

const problemCards = [
  {
    title: "做过，不等于被看见",
    desc: "没写成岗位关键词，系统可能判定匹配不足。",
    tag: "关键词风险",
    tone: "coral",
    icon: "search"
  },
  {
    title: "非典型经历，不等于不相关",
    desc: "转专业、科研、竞赛等经历，需要转成能力证据。",
    tag: "经历误读",
    tone: "aqua",
    icon: "puzzle"
  },
  {
    title: "秒拒不是结论",
    desc: "系统帮你定位问题，并生成复核与解释话术。",
    tag: "复核话术",
    tone: "amber",
    icon: "chat"
  }
];

const flowSteps = [
  {
    title: "原始经历",
    desc: "负责小红书内容整理，协助收集反馈。",
    icon: "file",
    tone: "coral"
  },
  {
    title: "系统解析",
    desc: "命中：小红书、反馈\n缺失：增长、运营、复盘",
    icon: "bot",
    tone: "aqua"
  },
  {
    title: "潜在误读",
    desc: "经历相关，但岗位表达不足",
    icon: "warning",
    tone: "amber"
  },
  {
    title: "建议转译",
    desc: "参与内容运营与反馈整理，\n支持选题优化与阶段复盘。",
    icon: "check",
    tone: "aqua"
  }
];

const proofItems = [
  { label: "证据约束改写", tone: "coral" },
  { label: "不虚构数据", tone: "aqua" },
  { label: "不承诺录用", tone: "amber" }
];

const usageSteps = [
  {
    title: "输入岗位 JD",
    desc: "提取关键词与隐性要求",
    icon: "docSearch",
    tone: "coral"
  },
  {
    title: "上传 / 粘贴简历",
    desc: "解析教育、项目、实习与技能",
    icon: "upload",
    tone: "aqua"
  },
  {
    title: "生成风险报告",
    desc: "识别关键词缺失、经历误读\n与表达问题",
    icon: "targetWarning",
    tone: "amber"
  },
  {
    title: "获得优化建议",
    desc: "输出改写建议、复核话术\n与面试解释",
    icon: "bubbleCheck",
    tone: "aqua"
  }
];

const resultItems = [
  {
    title: "你将获得",
    desc: "结构化输出结果",
    icon: "shield",
    tone: "coral"
  },
  {
    title: "算法可读性评分",
    desc: "衡量简历被系统理解的程度",
    icon: "score",
    tone: "coral",
    badge: "92"
  },
  {
    title: "改写建议",
    desc: "逐段优化表达与关键词",
    icon: "note",
    tone: "aqua"
  },
  {
    title: "复核话术",
    desc: "面试问答与场景话术库",
    icon: "message",
    tone: "amber"
  }
];

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  return (
    <div className="snap-home">
      <HeroSection />
      <ProductIntroSection />
      <UsageFlowSection />
    </div>
  );
}

function HeroSection() {
  const reduceMotion = useReducedMotion();
  const enter = (delay = 0) => ({
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.78, delay, ease: easeOut }
  });

  return (
    <section className="hero snap-section" aria-labelledby="home-title">
      <DecorObjects reduceMotion={Boolean(reduceMotion)} />
      <Navbar reduceMotion={Boolean(reduceMotion)} />

      <main className="hero-center">
        <motion.div className="hero-badge" {...enter(0.12)}>
          <SparkleIcon />
          <span>AI 算法友好度分析</span>
          <span className="badge-divider">·</span>
          <span className="badge-aqua">更公平的求职起点</span>
        </motion.div>

        <motion.div className="brand-line" {...enter(0.22)}>
          <span className="brand-word">BiasBreaker&nbsp;&nbsp;Career</span>
        </motion.div>

        <motion.h1 id="home-title" className="hero-title" {...enter(0.32)}>
          打破算法偏见，让真实能力被看见
        </motion.h1>

        <motion.p className="hero-subtitle" {...enter(0.42)}>
          识别简历在招聘算法中的可读性风险，优化表达方式，
          <br className="hidden sm:block" />
          在投递前生成复核与申诉话术，提高被看见的机会。
        </motion.p>

        <motion.div className="hero-actions" aria-label="首页操作" {...enter(0.52)}>
          <Link href="/analyze" className="liquid-button" aria-label="开始分析简历">
            开始分析
          </Link>
          <Link href="/analyze?demo=1" className="glass-secondary-button" aria-label="查看分析示例">
            查看示例
          </Link>
        </motion.div>
      </main>

      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 82, scale: 0.96, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.92, delay: 0.58, ease: easeOut }}
      >
        <ScorePreviewCard />
      </motion.div>
    </section>
  );
}

function ProductIntroSection() {
  const reduceMotion = useReducedMotion();
  const enter = (delay = 0) => ({
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, filter: "blur(10px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: false, amount: 0.35 },
    transition: { duration: 0.74, delay, ease: easeOut }
  });

  return (
    <section id="intro" className="intro-screen snap-section" aria-labelledby="intro-title">
      <div className="intro-orb intro-orb-coral" aria-hidden="true" />
      <div className="intro-orb intro-orb-aqua" aria-hidden="true" />

      <div className="intro-content">
        <div className="intro-layout">
          <motion.div className="intro-copy" {...enter(0.04)}>
            <div className="intro-badge">
              <SparkleIcon />
              <span>产品介绍</span>
              <i />
              <strong>Why BiasBreaker Career</strong>
            </div>

            <h2 id="intro-title">
              不是能力不够，
              <br />
              而是简历没被读懂
            </h2>
            <p>
              算法先看关键词、结构与证据。
              <br />
              我们帮你把真实经历转成更易被系统理解的表达。
            </p>

            <div className="problem-list" aria-label="求职者常见算法误读问题">
              {problemCards.map((item, index) => (
                <motion.article className="problem-card" key={item.title} {...enter(0.12 + index * 0.06)}>
                  <span className={`problem-icon ${item.tone}`}>
                    <FeatureIcon icon={item.icon} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                  <em className={item.tone}>{item.tag}</em>
                </motion.article>
              ))}
            </div>
          </motion.div>

          <motion.aside className="flow-panel" aria-label="简历被系统看到后的处理流程" {...enter(0.16)}>
            <div className="flow-panel-header">
              <h3>一份简历被系统看到时，会发生什么？</h3>
              <span aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>

            <div className="flow-list">
              {flowSteps.map((step, index) => (
                <motion.div className="flow-row" key={step.title} {...enter(0.22 + index * 0.08)}>
                  <div className="flow-index-wrap">
                    <span className={`flow-index ${step.tone}`}>{index + 1}</span>
                  </div>
                  <article className={`flow-card ${step.tone}`}>
                    <span className={`flow-icon ${step.tone}`}>
                      <FeatureIcon icon={step.icon} />
                    </span>
                    <div>
                      <h4>{step.title}</h4>
                      <p>{step.desc}</p>
                    </div>
                  </article>
                </motion.div>
              ))}
            </div>
          </motion.aside>
        </div>

        <motion.div className="proof-bar" {...enter(0.34)}>
          <span className="proof-shield">
            <ShieldStarIcon />
          </span>
          <strong>
            我们不帮你编造经历，只帮你把<span>真实能力</span>说清楚
          </strong>
          <div className="proof-list">
            {proofItems.map((item) => (
              <div className="proof-item" key={item.label}>
                <FeatureIcon icon="shield" tone={item.tone} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function UsageFlowSection() {
  const reduceMotion = useReducedMotion();
  const enter = (delay = 0) => ({
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, filter: "blur(10px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: false, amount: 0.35 },
    transition: { duration: 0.72, delay, ease: easeOut }
  });

  return (
    <section id="flow" className="usage-screen snap-section" aria-labelledby="usage-title">
      <div className="usage-dot-grid usage-dot-grid-top" aria-hidden="true" />
      <div className="usage-dot-grid usage-dot-grid-bottom" aria-hidden="true" />
      <div className="usage-wave usage-wave-coral" aria-hidden="true" />
      <div className="usage-wave usage-wave-aqua" aria-hidden="true" />

      <div className="usage-content">
        <motion.div className="usage-heading" {...enter(0.04)}>
          <div className="intro-badge usage-badge">
            <SparkleIcon />
            <span>使用流程</span>
            <i />
            <strong>How It Works</strong>
          </div>
          <h2 id="usage-title">4 步完成一次反误读求职分析</h2>
          <p>从岗位 JD 到复核话术，把真实能力转化为更容易被系统和 HR 理解的表达。</p>
        </motion.div>

        <div className="usage-steps" aria-label="四步使用流程">
          {usageSteps.map((step, index) => (
            <motion.article className={`usage-step-card ${step.tone}`} key={step.title} {...enter(0.12 + index * 0.07)}>
              <span className={`usage-step-index ${step.tone}`}>{index + 1}</span>
              <span className={`usage-step-icon ${step.tone}`}>
                <span className={`usage-object usage-object-${step.icon}`}>
                  <i />
                  <b />
                </span>
              </span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              {index < usageSteps.length - 1 && <span className="usage-connector" aria-hidden="true">→</span>}
            </motion.article>
          ))}
        </div>

        <motion.div className="result-strip" aria-label="分析完成后可获得的结果" {...enter(0.36)}>
          {resultItems.map((item, index) => (
            <div className="result-item" key={item.title}>
              <span className={`result-icon ${item.tone}`}>
                {item.badge ? <strong>{item.badge}</strong> : <FeatureIcon icon={item.icon} />}
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
              {index === 0 && <i aria-hidden="true" />}
            </div>
          ))}
        </motion.div>

        <motion.div className="usage-cta-wrap" {...enter(0.44)}>
          <Link href="/analyze" className="usage-cta" aria-label="开始分析">
            <SparkleIcon />
            <span>开始分析</span>
            <b aria-hidden="true">→</b>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Navbar({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.header
      className="glass-nav"
      initial={reduceMotion ? { opacity: 1, x: "-50%" } : { opacity: 0, x: "-50%", y: -22, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: "-50%", y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.72, ease: easeOut }}
    >
      <Link href="/" className="nav-brand" aria-label="BiasBreaker Career 首页">
        <span className="brand-icon">
          <Image src="/logo.png" alt="" fill sizes="60px" className="brand-logo" priority />
        </span>
        <span className="brand-name">BiasBreaker Career</span>
      </Link>

      <nav className="nav-links" aria-label="主导航">
        {navItems.map((item) =>
          item.href.startsWith("/") ? (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ) : (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          )
        )}
      </nav>

      <Link href="/analyze" className="nav-button">
        开始分析
      </Link>
    </motion.header>
  );
}

function ScorePreviewCard() {
  return (
    <aside className="score-preview-card" aria-label="算法可读性评分样例卡片">
      <div className="score-column">
        <div className="score-label">
          <span>算法可读性评分</span>
          <span className="info-dot">i</span>
        </div>
        <div className="score-number">
          <span>68</span>
          <strong>/100</strong>
        </div>
        <span className="risk-pill">中等风险</span>
        <div className="score-track">
          <span />
        </div>
        <div className="score-scale">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
        <p className="score-tip">
          <TipIcon />
          存在可优化项，建议优化后再投递
        </p>
      </div>

      <div className="radar-column">
        <RadarChart />
      </div>

      <div className="action-column" id="example" aria-label="分析能力入口">
        {actions.map((action) => (
          <button key={action.label} type="button" className="action-card">
            <ActionIcon icon={action.icon} tone={action.tone} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function RadarChart() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-labelledby="radar-title radar-desc" className="radar-chart">
      <title id="radar-title">算法可读性维度分布</title>
      <desc id="radar-desc">关键词覆盖72，结构清晰度65，成就可量化60，表达流畅度75。</desc>
      <g fill="none" stroke="#cbd5e1" strokeWidth="1">
        <path d="M100 20 L180 100 L100 180 L20 100 Z" />
        <path d="M100 44 L156 100 L100 156 L44 100 Z" />
        <path d="M100 68 L132 100 L100 132 L68 100 Z" />
        <path d="M100 20 V180 M20 100 H180" strokeDasharray="2 4" />
      </g>
      <path d="M100 42 L152 100 L100 148 L40 100 Z" fill="rgba(85, 200, 207, 0.28)" stroke="#18a8b5" strokeWidth="3" />
      {metrics.map((metric) => (
        <circle key={metric.label} cx={metric.x} cy={metric.y} r="3.5" fill="#13b6c2" />
      ))}
      <text x="100" y="5" textAnchor="middle" className="radar-muted">关键词覆盖</text>
      <text x="100" y="22" textAnchor="middle" className="radar-value">72</text>
      <text x="194" y="91" textAnchor="middle" className="radar-muted">结构清晰度</text>
      <text x="194" y="111" textAnchor="middle" className="radar-value">65</text>
      <text x="100" y="196" textAnchor="middle" className="radar-muted">成就可量化</text>
      <text x="100" y="214" textAnchor="middle" className="radar-value">60</text>
      <text x="6" y="91" textAnchor="middle" className="radar-muted">表达流畅度</text>
      <text x="6" y="111" textAnchor="middle" className="radar-value">75</text>
    </svg>
  );
}

function DecorObjects({ reduceMotion }: { reduceMotion: boolean }) {
  const objectTransition = { duration: 1, delay: 0.2, ease: easeOut };
  const initial = (x: number, y: number) => (reduceMotion ? { opacity: 0.88 } : { opacity: 0, x, y, filter: "blur(8px)" });
  const animate = { opacity: 0.88, x: 0, y: 0, filter: "blur(0px)" };

  return (
    <div aria-hidden="true" className="decor-layer">
      <motion.div className="decor decor-paperclip" initial={initial(-38, 18)} animate={animate} transition={objectTransition}>
        <div className="paperclip-shape" />
      </motion.div>
      <motion.div className="decor decor-keyboard" initial={initial(-80, 54)} animate={animate} transition={{ ...objectTransition, delay: 0.28 }}>
        <div className="keyboard-shape">
          {keyboardRows.map((row) => (
            <div className="keyboard-row" key={row}>
              {row.split("").map((key) => (
                <span key={key}>{key}</span>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div className="decor decor-note" initial={initial(68, -46)} animate={animate} transition={{ ...objectTransition, delay: 0.18 }}>
        <div className="note-shell">
          <div className="note-clip" />
          <div className="note-paper">
            <p>真实能力<br />不该被算法定义</p>
            <span />
          </div>
        </div>
      </motion.div>
      <motion.div className="decor decor-pen" initial={initial(60, 25)} animate={animate} transition={{ ...objectTransition, delay: 0.34 }}>
        <div className="pen-shape" />
      </motion.div>
      <motion.div className="decor decor-clip" initial={initial(45, 42)} animate={animate} transition={{ ...objectTransition, delay: 0.4 }}>
        <div className="desk-note-shape">
          <span />
        </div>
      </motion.div>
    </div>
  );
}

function ActionIcon({ icon, tone }: { icon: string; tone: string }) {
  const colorClass = {
    cyan: "text-cyan-500",
    amber: "text-amber-500",
    violet: "text-violet-500",
    rose: "text-rose-500"
  }[tone];

  return (
    <span className={colorClass} aria-hidden="true">
      {icon === "doc" && (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v5h5" />
          <circle cx="14" cy="14" r="3" />
          <path d="m17 17 3 3" />
        </svg>
      )}
      {icon === "shield" && (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      )}
      {icon === "edit" && (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 20h5L20 9l-5-5L4 15z" />
          <path d="m13 6 5 5" />
        </svg>
      )}
      {icon === "chat" && (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 6h14a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-2-3V9a3 3 0 0 1 3-3z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      )}
    </span>
  );
}

function FeatureIcon({ icon, tone }: { icon: string; tone?: string }) {
  const className = tone ? `feature-inline-icon ${tone}` : undefined;

  return (
    <svg className={className} width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {icon === "search" && (
        <>
          <circle cx="10.5" cy="10.5" r="5.8" />
          <path d="m15 15 5 5" strokeLinecap="round" />
        </>
      )}
      {icon === "puzzle" && (
        <path d="M9 3h4a2 2 0 0 1 2 2v2h2a2 2 0 1 1 0 4h-2v3h-3v2a2 2 0 1 1-4 0v-2H5a2 2 0 0 1-2-2V9h2a2 2 0 1 0 0-4H3V5a2 2 0 0 1 2-2h4Z" strokeLinejoin="round" />
      )}
      {icon === "chat" && (
        <>
          <path d="M5 6h14a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-2-3V9a3 3 0 0 1 3-3Z" strokeLinejoin="round" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" strokeLinecap="round" />
        </>
      )}
      {icon === "file" && (
        <>
          <path d="M6 3h8l4 4v14H6Z" strokeLinejoin="round" />
          <path d="M14 3v5h5M9 12h6M9 16h6" strokeLinecap="round" />
        </>
      )}
      {icon === "bot" && (
        <>
          <rect x="5" y="8" width="14" height="10" rx="3" />
          <path d="M12 5v3M8.5 12h.01M15.5 12h.01M9 16h6" strokeLinecap="round" />
          <path d="M3 12h2M19 12h2" strokeLinecap="round" />
        </>
      )}
      {icon === "warning" && (
        <>
          <path d="m12 4 9 16H3Z" strokeLinejoin="round" />
          <path d="M12 9v5M12 17h.01" strokeLinecap="round" />
        </>
      )}
      {icon === "check" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12.2 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {icon === "shield" && (
        <>
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {icon === "docSearch" && (
        <>
          <path d="M6 3h8l4 4v14H6Z" strokeLinejoin="round" />
          <path d="M14 3v5h5M9 12h4" strokeLinecap="round" />
          <circle cx="15" cy="16" r="3" />
          <path d="m17.4 18.4 2.4 2.4" strokeLinecap="round" />
        </>
      )}
      {icon === "upload" && (
        <>
          <path d="M12 15V4" strokeLinecap="round" />
          <path d="m7.5 8.5 4.5-4.5 4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
        </>
      )}
      {icon === "targetWarning" && (
        <>
          <circle cx="12" cy="12" r="8" opacity=".18" />
          <circle cx="12" cy="12" r="5" opacity=".3" />
          <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          <path d="m18 19 2.5 2.5" strokeLinecap="round" />
        </>
      )}
      {icon === "bubbleCheck" && (
        <>
          <path d="M5 6h14a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-6l-5 4v-4H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z" strokeLinejoin="round" />
          <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {icon === "score" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {icon === "note" && (
        <>
          <path d="M5 4h14v16H5Z" strokeLinejoin="round" />
          <path d="M8 8h8M8 12h6M8 16h5" strokeLinecap="round" />
        </>
      )}
      {icon === "message" && (
        <>
          <path d="M4 6h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
          <path d="M7 11h6M7 14h4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function ShieldStarIcon() {
  return (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true">
      <path d="M14 1.7c4.3 2.8 8.1 3.6 11.6 3.4.1 10.7-3.7 18.5-11.6 24.8C6.1 23.6 2.3 15.8 2.4 5.1 5.9 5.3 9.7 4.5 14 1.7Z" fill="url(#shieldGradient)" />
      <path d="M14 1.7c4.3 2.8 8.1 3.6 11.6 3.4.1 10.7-3.7 18.5-11.6 24.8C6.1 23.6 2.3 15.8 2.4 5.1 5.9 5.3 9.7 4.5 14 1.7Z" stroke="white" strokeOpacity=".74" strokeWidth="1.4" />
      <path d="m14 9.2 1.55 3.15 3.48.5-2.52 2.45.6 3.46L14 17.13l-3.11 1.63.6-3.46-2.52-2.45 3.48-.5L14 9.2Z" fill="white" />
      <defs>
        <linearGradient id="shieldGradient" x1="6" y1="3" x2="22" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB39D" />
          <stop offset=".48" stopColor="#FF7D73" />
          <stop offset="1" stopColor="#E95A73" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="sparkle-icon">
      <path d="M12 2.8c.8 4 2.5 5.7 6.5 6.5-4 .8-5.7 2.5-6.5 6.5-.8-4-2.5-5.7-6.5-6.5 4-.8 5.7-2.5 6.5-6.5Z" fill="currentColor" />
      <path d="M5 15.8c.34 1.7 1.08 2.43 2.75 2.75C6.08 18.9 5.34 19.62 5 21.3c-.34-1.68-1.07-2.41-2.75-2.75C3.93 18.23 4.66 17.5 5 15.8Z" fill="currentColor" opacity=".55" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="tip-icon">
      <path d="M12 3a7 7 0 0 0-4.2 12.6c.7.52 1.2 1.15 1.4 1.9h5.6c.2-.75.7-1.38 1.4-1.9A7 7 0 0 0 12 3Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 21h5M9 18.4h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
