"use client";

import { useEffect, useRef } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdUnit({ slot, format = "auto", className }: AdUnitProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!client || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}

    const ins = insRef.current;
    if (!ins) return;

    function collapseIfUnfilled() {
      if (!ins) return;
      if (ins.getAttribute("data-ad-status") === "unfilled") {
        ins.style.setProperty("display", "none", "important");
        ins.style.setProperty("height", "0", "important");
        const wrapper = ins.parentElement;
        if (wrapper) wrapper.style.display = "none";
      }
    }

    // Watch for Google setting data-ad-status
    const observer = new MutationObserver(collapseIfUnfilled);
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status", "style"] });

    // Also check after a short delay in case the attribute was already set before we observed
    const t = setTimeout(collapseIfUnfilled, 2000);

    return () => { observer.disconnect(); clearTimeout(t); };
  }, [client]);

  if (!client) return null;

  return (
    <div className={className}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
