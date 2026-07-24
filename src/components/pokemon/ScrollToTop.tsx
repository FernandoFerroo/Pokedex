"use client";

import { useEffect } from "react";

/**
 * Next keeps the previous scroll offset on navigation whenever the new page
 * still has content at that offset, so opening a sheet from deep in the list
 * lands mid-page. Force the viewport to the top on mount and whenever the
 * shown species changes (detail -> detail via the evolution chain).
 */
export function ScrollToTop({ trigger }: { trigger: string }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [trigger]);
  return null;
}
