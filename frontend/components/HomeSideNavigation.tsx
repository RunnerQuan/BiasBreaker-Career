"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const mainNavItems = [
  { label: "首页", href: "/" },
  { label: "简历分析", href: "/analyze" },
  { label: "历史记录", href: "/history" }
];

const previewDimensions = [
  { key: "keywordCoverage", label: "关键词覆盖", score: 72 },
  { key: "structureClarity", label: "结构清晰度", score: 65 },
  { key: "evidenceStrength", label: "经历证据", score: 60 },
  { key: "atsReadability", label: "系统可读性", score: 75 }
] as const;

const previewScore = Math.round(
  previewDimensions[0].score * 0.34 +
    previewDimensions[1].score * 0.2 +
    previewDimensions[2].score * 0.32 +
    previewDimensions[3].score * 0.14
);

const homeSections = [
  { key: "home", label: "首页", english: "Home", selector: ".hero" },
  { key: "intro", label: "产品介绍", english: "Intro", selector: "#intro" },
  { key: "cases", label: "案例展示", english: "Cases", selector: "#cases" },
  { key: "flow", label: "使用流程", english: "Flow", selector: "#flow" }
] as const;

export function HomeSideNavigation() {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState<(typeof homeSections)[number]["key"]>("home");

  useEffect(() => {
    if (pathname !== "/") {
      setHost(null);
      return;
    }

    const attach = () => {
      const home = document.querySelector<HTMLElement>(".snap-home");
      if (!home) return null;

      const existing = home.querySelector<HTMLElement>(".home-side-nav-portal");
      if (existing) {
        setHost(existing);
        return existing;
      }

      const mount = document.createElement("div");
      mount.className = "home-side-nav-portal";
      home.appendChild(mount);
      setHost(mount);
      return mount;
    };

    const initial = attach();
    const observer = new MutationObserver(() => {
      attach();
      synchronizeHomepageUi();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    synchronizeHomepageUi();

    return () => {
      observer.disconnect();
      if (initial?.isConnected) initial.remove();
      setHost(null);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    synchronizeHomepageUi();
  }, [pathname, host]);

  const observedSections = useMemo(() => homeSections, []);

  useEffect(() => {
    if (!host || pathname !== "/") return;
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
  }, [host, observedSections, pathname]);

  if (!host || pathname !== "/") return null;

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

function synchronizeHomepageUi() {
  const home = document.querySelector<HTMLElement>(".snap-home");
  if (!home) return;

  synchronizeMainNavigation(home);
  synchronizeScorePreview(home);
}

function synchronizeMainNavigation(home: HTMLElement) {
  const nav = home.querySelector<HTMLElement>(".glass-nav .nav-links");
  if (!nav) return;

  const currentLabels = Array.from(nav.querySelectorAll("a")).map((anchor) => anchor.textContent?.trim()).join("|");
  const expectedLabels = mainNavItems.map((item) => item.label).join("|");
  if (currentLabels === expectedLabels) return;

  nav.replaceChildren(
    ...mainNavItems.map((item) => {
      const anchor = document.createElement("a");
      anchor.href = item.href;
      anchor.textContent = item.label;
      if (item.href === "/") anchor.className = "active";
      return anchor;
    })
  );
}

function synchronizeScorePreview(home: HTMLElement) {
  const scoreCard = home.querySelector<HTMLElement>(".score-preview-card");
  if (!scoreCard) return;

  const scoreValue = scoreCard.querySelector<HTMLElement>(".score-number span");
  if (scoreValue) scoreValue.textContent = String(previewScore);

  const scoreMarker = scoreCard.querySelector<HTMLElement>(".score-track span");
  if (scoreMarker) scoreMarker.style.left = `${previewScore}%`;

  const mutedLabels = Array.from(scoreCard.querySelectorAll<SVGTextElement>(".radar-muted"));
  const valueLabels = Array.from(scoreCard.querySelectorAll<SVGTextElement>(".radar-value"));
  const orderedDimensions = [
    previewDimensions[0],
    previewDimensions[1],
    previewDimensions[2],
    previewDimensions[3]
  ];

  orderedDimensions.forEach((dimension, index) => {
    if (mutedLabels[index]) mutedLabels[index].textContent = dimension.label;
    if (valueLabels[index]) valueLabels[index].textContent = String(dimension.score);
  });

  const description = scoreCard.querySelector(".radar-chart desc");
  if (description) {
    description.textContent = `关键词覆盖${previewDimensions[0].score}，结构清晰度${previewDimensions[1].score}，经历证据${previewDimensions[2].score}，系统可读性${previewDimensions[3].score}。总分按关键词覆盖34%、结构清晰度20%、经历证据32%、系统可读性14%计算。`;
  }
}
