"use client";

import { useEffect, useRef } from "react";

interface GoogleAdProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function GoogleAd({
  slot,
  format = "auto",
  className = "",
  style,
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense publisher ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Pre-defined ad placements
export function SidebarAd({ className = "" }: { className?: string }) {
  return (
    <GoogleAd
      slot="1234567890" // Replace with your ad slot ID
      format="vertical"
      className={`mx-auto max-w-xs ${className}`}
    />
  );
}

export function BannerAd({ className = "" }: { className?: string }) {
  return (
    <GoogleAd
      slot="0987654321" // Replace with your ad slot ID
      format="horizontal"
      className={`mx-auto max-w-4xl ${className}`}
    />
  );
}

export function InArticleAd({ className = "" }: { className?: string }) {
  return (
    <GoogleAd
      slot="1122334455" // Replace with your ad slot ID
      format="rectangle"
      className={`mx-auto ${className}`}
    />
  );
}
