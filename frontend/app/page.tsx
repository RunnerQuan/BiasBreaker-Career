"use client";

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

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  return <HeroSection />;
}

function HeroSection() {
  const reduceMotion = useReducedMotion();
  const enter = (delay = 0) => ({
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.78, delay, ease: easeOut }
  });

  return (
    <section className="hero" aria-labelledby="home-title">
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

      <div id="intro" className="sr-only">
        BiasBreaker Career 帮助求职者识别算法误读风险。
      </div>
      <div id="flow" className="sr-only">
        使用流程包含岗位解析、简历分析、风险检测与改写建议。
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
          <ShieldStarIcon />
        </span>
        <span>BiasBreaker Career</span>
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
