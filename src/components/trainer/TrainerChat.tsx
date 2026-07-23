"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Send, Sparkles, X } from "lucide-react";
import { useFilters } from "@/hooks/use-filters";
import {
  CATEGORY_LABELS_ES,
  COLOR_LABELS_ES,
  EGG_GROUP_LABELS_ES,
  HABITAT_LABELS_ES,
  SHAPE_LABELS_ES,
  TYPE_LABELS_ES,
} from "@/lib/pokemon-meta";
import { SORT_LABELS_ES } from "@/lib/sort";
import { cn } from "@/lib/utils";
import type {
  TrainerAction,
  TrainerFilterPatch,
  TrainerResponse,
} from "@/types/trainer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** UI side effects that came with this assistant reply (shown as chips). */
  actions?: TrainerAction[];
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola, joven entrenador! Soy el Profesor Oak, investigador Pokémon de Pueblo Paleta, y esta Pokédex es mi gran invento. Pregúntame lo que quieras del mundo Pokémon, o pídeme cosas como «enséñame los legendarios de Kanto» o «abre la ficha de Charizard». ¡La ciencia Pokémon nos espera!",
};

const SUGGESTIONS = [
  "Enséñame los legendarios de Kanto",
  "Filtra por tipo eléctrico",
  "Abre la ficha de Charizard",
  "¿Cuál es tu Pokémon favorito?",
];

/** Survives the round trip to a detail page and back. */
const STORAGE_KEY = "trainer-chat-v2";

const CLEAR_ALL: TrainerFilterPatch = {
  q: null,
  type: null,
  gen: null,
  sort: null,
  color: null,
  habitat: null,
  shape: null,
  egg: null,
  cat: null,
  stage: null,
  fav: null,
};

/** Human summary of one action, for the chips under Oak's replies. */
function describeAction(action: TrainerAction): string {
  if (action.type === "clear_filters") return "Filtros limpiados";
  if (action.type === "open_pokemon") return `Abriendo ficha: ${action.name}`;
  const parts: string[] = [];
  const { patch } = action;
  if (patch.q) parts.push(`búsqueda «${patch.q}»`);
  if (patch.type) parts.push(`tipo ${TYPE_LABELS_ES[patch.type] ?? patch.type}`);
  if (patch.gen) parts.push(`Gen ${patch.gen}`);
  if (patch.color)
    parts.push(`color ${COLOR_LABELS_ES[patch.color] ?? patch.color}`);
  if (patch.habitat)
    parts.push(`hábitat ${HABITAT_LABELS_ES[patch.habitat] ?? patch.habitat}`);
  if (patch.shape)
    parts.push(`forma ${SHAPE_LABELS_ES[patch.shape] ?? patch.shape}`);
  if (patch.egg)
    parts.push(`huevo ${EGG_GROUP_LABELS_ES[patch.egg] ?? patch.egg}`);
  if (patch.cat) parts.push(CATEGORY_LABELS_ES[patch.cat] ?? patch.cat);
  if (patch.stage) parts.push(`etapa ${patch.stage}`);
  if (patch.sort) parts.push(SORT_LABELS_ES[patch.sort] ?? patch.sort);
  const cleared = Object.values(patch).some((v) => v === null);
  if (parts.length === 0) return cleared ? "Filtros retirados" : "Filtros";
  return `Filtros: ${parts.join(" · ")}`;
}

/**
 * Professor Oak's portrait (public/oak.png), used verbatim as the chat avatar:
 * his official-style bust in front of a Poké Ball. `rounded-full` crops the
 * white corners outside the ball.
 */
function OakAvatar({ className }: { className?: string }) {
  return (
    <Image
      src="/oak.png"
      alt=""
      width={96}
      height={96}
      className={cn("rounded-full", className)}
    />
  );
}

/** Remembers whether the panel was left open across visits to the home page. */
const OPEN_KEY = "trainer-chat-open";

/**
 * Chat lateral con el Profesor Oak. Vive como panel deslizante fijo al borde
 * derecho de la ventana (no ocupa hueco en el layout de la Pokédex) y se
 * abre desde un botón flotante con su cara. La conversación se guarda en
 * sessionStorage para sobrevivir a los saltos a las fichas.
 */
export function TrainerChat() {
  const router = useRouter();
  const [filters, setFilters] = useFilters();
  // Lazy init (client-only component): reopen if the user left it open.
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(OPEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  // Lazy init from sessionStorage: safe because this component never server-
  // renders (useFilters -> useSearchParams keeps it client-only in prerender).
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [WELCOME];
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Corrupt storage: start fresh.
    }
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      // Storage unavailable: the toggle simply won't be remembered.
    }
  }, [open]);

  // Persist so the conversation survives jumps to the detail pages.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Storage full/unavailable: the chat still works, it just won't persist.
    }
  }, [messages]);

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const applyActions = (actions: TrainerAction[]) => {
    let navigateTo: string | null = null;
    for (const action of actions) {
      if (action.type === "set_filters") {
        setFilters({ ...action.patch, page: null });
      } else if (action.type === "clear_filters") {
        setFilters({ ...CLEAR_ALL, page: null });
      } else if (action.type === "open_pokemon") {
        navigateTo = `/pokemon/${encodeURIComponent(action.name)}`;
      }
    }
    if (navigateTo) {
      const target = navigateTo;
      // Small pause so Oak's reply is visible before jumping to the entry.
      setTimeout(() => router.push(target), 700);
    }
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || pending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          filters,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | (TrainerResponse & { error?: string })
        | null;
      if (!res.ok || !data || data.error) {
        setError(
          data?.error ??
            "El transmisor de la Pokédex no responde. ¡Inténtalo de nuevo!",
        );
        return;
      }
      setMessages([
        ...next,
        { role: "assistant", content: data.message, actions: data.actions },
      ]);
      if (data.actions.length > 0) applyActions(data.actions);
    } catch {
      setError("Se ha cortado la conexión con el laboratorio de Pueblo Paleta…");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {/* Floating opener, pinned to the right edge at every size. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Hablar con el Profesor Oak"
        className={cn(
          "group fixed right-5 bottom-16 z-30 flex flex-col items-center gap-2.5",
          open && "hidden",
        )}
      >
        <span className="rounded-lg border border-slate-700/80 bg-[#0a101d]/95 px-3.5 py-2 text-center font-mono text-xs leading-snug tracking-wide text-slate-200 shadow-[0_0_14px_-2px_rgba(34,211,238,0.35)] backdrop-blur transition group-hover:border-cyan-400/60 group-hover:text-cyan-300">
          Habla con el Profesor Oak
          <span className="block text-[10px] text-emerald-400/90 uppercase">
            Pregunta · Filtra · Explora
          </span>
        </span>
        <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-red-500/60 bg-[#0a101d] shadow-[0_0_28px_4px_rgba(239,68,68,0.5)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_0_38px_6px_rgba(239,68,68,0.65)]">
          <OakAvatar className="h-full w-full" />
        </span>
      </button>

      <aside
        aria-label="Chat con el Profesor Oak"
        className={cn(
          // Slide-in overlay pinned to the right edge of the viewport; the
          // Pokédex keeps its full width underneath at every screen size.
          "fixed inset-y-0 right-0 z-40 flex w-[min(100vw,48rem)] flex-col border-l border-slate-700/60 bg-[#050810]/95 shadow-[-12px_0_32px_rgba(0,0,0,0.55)] backdrop-blur transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-700/60 px-4 py-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0a101d] ring-2 ring-red-500/60 shadow-[0_0_12px_1px_rgba(239,68,68,0.4)]">
            <OakAvatar className="h-full w-full" />
            <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[#050810] bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold tracking-wide text-slate-100">
              PROFESOR OAK
            </p>
            <p className="truncate font-mono text-xs tracking-wider text-emerald-400/90 uppercase">
              Investigador Pokémon · Pueblo Paleta
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar chat"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5",
                message.role === "user" && "justify-end",
              )}
            >
              {message.role === "assistant" && (
                <OakAvatar className="mt-1 h-7 w-7 shrink-0" />
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  message.role === "user"
                    ? "rounded-br-sm border border-red-500/40 bg-red-500/10 text-slate-100"
                    : "rounded-bl-sm border border-slate-700/70 bg-[#0a101d]/90 text-slate-200",
                )}
              >
                {message.content}
                {message.actions && message.actions.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {message.actions.map((action, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 rounded border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-xs text-cyan-300"
                      >
                        <Sparkles size={10} />
                        {describeAction(action)}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          ))}

          {pending && (
            <div className="flex items-center gap-2.5">
              <OakAvatar className="h-7 w-7 shrink-0 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-slate-400">
                EL PROFESOR ESTÁ ESCRIBIENDO…
              </span>
            </div>
          )}

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-400">
              {error}
            </p>
          )}

          {messages.length <= 1 && !pending && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-slate-700/80 bg-[#0a101d]/90 px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 border-t border-slate-700/60 px-3 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Pregúntale al Profesor Oak…"
            aria-label="Mensaje para el Profesor Oak"
            disabled={pending}
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-700/80 bg-[#0a101d]/90 px-3 font-mono text-sm text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_14px_-2px_rgba(239,68,68,0.55)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || input.trim() === ""}
            aria-label="Enviar mensaje"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-500/50 bg-red-500/10 text-red-400 transition enabled:hover:bg-red-500/20 enabled:hover:shadow-[0_0_14px_-2px_rgba(239,68,68,0.6)] disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </aside>

      {/* Backdrop only on small screens, where the panel covers casi todo;
          en pantallas grandes la lista queda visible y sigue actualizándose
          en directo mientras Oak aplica filtros. */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar chat"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
        />
      )}
    </>
  );
}
