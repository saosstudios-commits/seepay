"use client";

import { useEffect, useState } from "react";

const SAMPLE_SHOPS = ["yourshop", "mamajollof", "amasbeauty", "kofifixes"];

export default function ShopNameTypewriter() {
  const [slug, setSlug] = useState(SAMPLE_SHOPS[0]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let nameIndex = 0;
    let cursor = SAMPLE_SHOPS[0].length;
    let deleting = true;
    let timeoutId = 0;

    const tick = () => {
      const currentName = SAMPLE_SHOPS[nameIndex];
      cursor += deleting ? -1 : 1;
      setSlug(currentName.slice(0, cursor));

      let delay = deleting ? 50 : 100;
      if (!deleting && cursor === currentName.length) {
        deleting = true;
        delay = 1800;
      } else if (deleting && cursor <= 0) {
        deleting = false;
        nameIndex = (nameIndex + 1) % SAMPLE_SHOPS.length;
        delay = 350;
      }

      timeoutId = window.setTimeout(tick, delay);
    };

    timeoutId = window.setTimeout(tick, 900);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  return (
    <span className="sign-chip sp-type-sign" aria-label={`${slug} shop address preview`}>
      <span>{slug}</span>
      <span>{rootDomain ? `.${rootDomain}` : " · Preview link"}</span>
    </span>
  );
}
