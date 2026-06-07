"use client";

import Link from "next/link";

type AppNavProps = {
  active?: "intro" | "flow" | "analyze" | "history";
};

const navItems = [
  { key: "intro", label: "产品介绍", href: "/#intro" },
  { key: "flow", label: "使用流程", href: "/#flow" },
  { key: "analyze", label: "简历分析", href: "/analyze" },
  { key: "history", label: "历史记录", href: "/history" }
] as const;

export function AppNav({ active }: AppNavProps) {
  return (
    <header className="glass-nav page-nav">
      <Link href="/" className="nav-brand" aria-label="BiasBreaker Career 首页">
        <span className="brand-icon">
          <ShieldStarIcon />
        </span>
        <span>BiasBreaker Career</span>
      </Link>

      <nav className="nav-links" aria-label="主导航">
        {navItems.map((item) => (
          <Link key={item.key} href={item.href} className={active === item.key ? "active" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <Link href="/analyze" className="nav-button">
        开始分析
      </Link>
    </header>
  );
}

function ShieldStarIcon() {
  return (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true">
      <path d="M14 1.7c4.3 2.8 8.1 3.6 11.6 3.4.1 10.7-3.7 18.5-11.6 24.8C6.1 23.6 2.3 15.8 2.4 5.1 5.9 5.3 9.7 4.5 14 1.7Z" fill="url(#appNavShieldGradient)" />
      <path d="M14 1.7c4.3 2.8 8.1 3.6 11.6 3.4.1 10.7-3.7 18.5-11.6 24.8C6.1 23.6 2.3 15.8 2.4 5.1 5.9 5.3 9.7 4.5 14 1.7Z" stroke="white" strokeOpacity=".74" strokeWidth="1.4" />
      <path d="m14 9.2 1.55 3.15 3.48.5-2.52 2.45.6 3.46L14 17.13l-3.11 1.63.6-3.46-2.52-2.45 3.48-.5L14 9.2Z" fill="white" />
      <defs>
        <linearGradient id="appNavShieldGradient" x1="6" y1="3" x2="22" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB39D" />
          <stop offset=".48" stopColor="#FF7D73" />
          <stop offset="1" stopColor="#E95A73" />
        </linearGradient>
      </defs>
    </svg>
  );
}
