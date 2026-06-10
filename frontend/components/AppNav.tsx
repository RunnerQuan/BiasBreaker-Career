"use client";

import Image from "next/image";
import Link from "next/link";

type AppNavProps = {
  active?: "home" | "analyze" | "history";
};

const navItems = [
  { key: "home", label: "首页", href: "/" },
  { key: "analyze", label: "简历分析", href: "/analyze" },
  { key: "history", label: "历史记录", href: "/history" }
] as const;

export function AppNav({ active }: AppNavProps) {
  return (
    <header className="glass-nav page-nav">
      <Link href="/" className="nav-brand" aria-label="BiasBreaker Career 首页">
        <span className="brand-icon">
          <Image src="/logo.png" alt="" fill sizes="60px" className="brand-logo" priority />
        </span>
        <span className="brand-name">BiasBreaker Career</span>
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
