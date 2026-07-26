"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";

/** `<model-viewer>` is a custom element, unknown to JSX — render via a cast. */
const ModelViewerTag = "model-viewer" as unknown as React.ElementType;

interface Model3DProps {
  /** URL of the .glb model. */
  src: string;
  /** Image shown while the model streams in. */
  poster?: string;
  alt: string;
  /** Called when the library or the model fails to load. */
  onFail: () => void;
}

/**
 * True 3D viewer for the creature: streams a glTF model and lets the user
 * orbit it 360° by dragging (auto-rotates while idle). The web component is
 * imported lazily so three.js only loads when the 3D tab is opened.
 */
export function Model3D({ src, poster, alt, onFail }: Model3DProps) {
  const d = useT().detail;
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLElement>(null);
  // The idle spin is a continuous WebGL animation, so no CSS media query can
  // reach it — the preference has to be read in JS and turned into a prop.
  // Dragging still works; only the unprompted rotation stops.
  const [spin, setSpin] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setSpin(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer")
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) onFail();
      });
    return () => {
      cancelled = true;
    };
  }, [onFail]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const fail = () => onFail();
    host.addEventListener("error", fail);
    return () => host.removeEventListener("error", fail);
  }, [ready, src, onFail]);

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {poster ? (
          // Plain <img>: the poster is already an optimized remote sprite and
          // this placeholder only lives for the instant the library loads.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={alt}
            className="max-h-full max-w-full object-contain opacity-60"
          />
        ) : (
          <span className="text-xs text-slate-300">{d.loadingModel}</span>
        )}
      </div>
    );
  }

  return (
    <ModelViewerTag
      ref={hostRef}
      src={src}
      poster={poster}
      alt={alt}
      camera-controls=""
      {...(spin ? { "auto-rotate": "" } : {})}
      auto-rotate-delay="0"
      rotation-per-second="25deg"
      interaction-prompt="none"
      disable-zoom=""
      disable-pan=""
      disable-tap=""
      shadow-intensity="0.9"
      exposure="1.05"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
