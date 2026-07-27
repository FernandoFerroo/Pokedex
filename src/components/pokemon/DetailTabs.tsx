"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n/client";

export interface DetailTab {
  id: string;
  /** Emoji shown before the label, e.g. "📊". */
  icon: string;
  label: string;
}

interface DetailTabsProps {
  tabs: DetailTab[];
  /** Server-rendered panel per tab id — stays mounted while hidden. */
  panels: Record<string, ReactNode>;
}

/**
 * Main tab rail of the detail sheet. The panels arrive already rendered from
 * the server (RSC children), so switching tabs is instant and free: we only
 * toggle the `hidden` attribute, which also preserves inner client state
 * (moves sub-tabs, sprite mode) and any Suspense content.
 */
export function DetailTabs({ tabs, panels }: DetailTabsProps) {
  const d = useT().detail;
  const [active, setActive] = useState(tabs[0]?.id);
  // The sheet mounts one DetailTabs per breakpoint layout, so fixed ids would
  // appear twice in the document and break every aria-controls pairing.
  const uid = useId();
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    buttonsRef.current[next]?.focus();
    setActive(tabs[next].id);
  };

  return (
    <div className="mt-8">
      <div
        role="tablist"
        aria-label={d.tabsAria}
        className="glass-aura flex gap-1.5 overflow-x-auto rounded-2xl p-1.5"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${uid}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") focusTab(index + 1);
              if (e.key === "ArrowLeft") focusTab(index - 1);
            }}
            className="detail-tab flex-1 rounded-xl px-1.5 py-2.5 font-display text-[0.7rem] leading-tight font-bold tracking-[0.04em] text-balance uppercase sm:px-3 sm:text-sm sm:tracking-[0.16em]"
          >
            <span aria-hidden className="mr-1.5">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${uid}-panel-${tab.id}`}
          aria-labelledby={`${uid}-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="mt-6 motion-safe:animate-[fade-in_250ms_ease-out]"
        >
          {panels[tab.id]}
        </div>
      ))}
    </div>
  );
}
