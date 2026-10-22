"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-reveal], .card, .kpi, .ticket, .sign-chip, main h1, main h2, main h3";

export default function DesignMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("sp-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    );

    const register = (element: Element) => {
      if (!(element instanceof HTMLElement) || element.dataset.spMotionReady) return;
      element.dataset.spMotionReady = "true";
      element.classList.add("sp-reveal");
      revealObserver.observe(element);
    };

    const scan = (root: Node) => {
      if (root instanceof Element) {
        if (root.matches(REVEAL_SELECTOR)) register(root);
        root.querySelectorAll(REVEAL_SELECTOR).forEach(register);
      } else if (root instanceof Document || root instanceof DocumentFragment) {
        root.querySelectorAll(REVEAL_SELECTOR).forEach(register);
      }
    };

    scan(document.body);

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach(scan);
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  return null;
}
