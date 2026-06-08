"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const mainNavItems = [
  { label: "首页", href: "/" },
  { label: "简历分析", href: "/analyze" },
  { label: "历史记录", href: "/history" }
];

const homeSections = [
  { key: "home", label: "首页", english: "Home", selector: ".hero" },
  { key: "intro", label: "产品介绍", english: "Intro", selector: "#intro" },
  { key: "cases", label: "案例展示", english: "Cases", selector: "#cases" },
  { key: "flow", label: "使用流程", english: "Flow", selector: "#flow" }
] as const;

export function HomeSideNavigation() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState<(typeof homeSections)[number]["key"]>("home");

  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".snap-home");
    if (!home) return;

    const mount = document.createElement("div");
    mount.className = "home-side-nav-portal";
    home.appendChild(mount);
    setHost(mount);

    return () => {
      setHost(null);
      mount.remove();
    };
  }, []);

  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".snap-home");
    if (!home) return;

    const nav = home.querySelector<HTMLElement>(".glass-nav .nav-links");
    if (!nav || nav.dataset.simplified === "true") return;

    nav.replaceChildren(
      ...mainNavItems.map((item) => {
        const anchor = document.createElement("a");
        anchor.href = item.href;
        anchor.textContent = item.label;
        if (item.href === "/") anchor.className = "active";
        return anchor;
      })
    );
    nav.dataset.simplified = "true";
  }, [host]);

  const observedSections = useMemo(() => homeSections, []);

  useEffect(() => {
    if (!host) return;
    const entries = observedSections
      .map((section) => ({ section, element: document.querySelector<HTMLElement>(section.selector) }))
      .filter((item): item is { section: (typeof homeSections)[number]; element: HTMLElement } => Boolean(item.element));

    if (!entries.length) return;

    const observer = new IntersectionObserver(
      (items) => {
        const visible = items
          .filter((item) => item.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const match = entries.find((entry) => entry.element === visible.target);
        if (match) setActive(match.section.key);
      },
      { threshold: [0.32, 0.48, 0.64], rootMargin: "-18% 0px -18% 0px" }
    );

    entries.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, [host, observedSections]);

  if (!host) return null;

  function scrollToSection(selector: string) {
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return createPortal(
    <nav className="home-side-nav" aria-label="首页分屏导航">
      <span className="home-side-nav-line" aria-hidden="true" />
      {homeSections.map((section, index) => (
        <button
          key={section.key}
          type="button"
          className={active === section.key ? "active" : undefined}
          onClick={() => scrollToSection(section.selector)}
          aria-current={active === section.key ? "true" : undefined}
        >
          <i>{String(index + 1).padStart(2, "0")}</i>
          <span>
            <strong>{section.label}</strong>
            <small>{section.english}</small>
          </span>
        </button>
      ))}
    </nav>,
    host
  );
}
