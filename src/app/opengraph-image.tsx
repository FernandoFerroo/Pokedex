import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-fonts";
import { SITE_NAME } from "@/lib/site";

/**
 * Default social card for the whole site: every route inherits it unless it
 * ships its own `opengraph-image` (the Pokémon sheet does). Rendered by satori,
 * so only flexbox and a subset of CSS work here — no grid, no `gap` shorthand
 * quirks, and every element with more than one child must be `display: flex`.
 */
export const alt = `${SITE_NAME} · Gen I–IX`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RED = "#ee1515";
const CYAN = "#38bdf8";
const INK = "#050a14";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 84px",
          backgroundColor: INK,
          backgroundImage:
            "radial-gradient(900px 620px at 82% 50%, rgba(238,21,21,0.22), transparent 70%), radial-gradient(700px 500px at 6% 8%, rgba(56,189,248,0.20), transparent 70%)",
          color: "#f8fafc",
          position: "relative",
          fontFamily: "Geist",
        }}
      >
        {/* Marco HUD: filo neón por dentro del sangrado. */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: "2px solid rgba(56,189,248,0.28)",
            borderRadius: 24,
          }}
        />
        {/* Barra superior tricolor, como el led de la Pokédex. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            backgroundImage: `linear-gradient(90deg, ${RED}, ${CYAN} 55%, #fde047)`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: 660 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "Orbitron",
              fontSize: 24,
              letterSpacing: 10,
              color: CYAN,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: CYAN,
                marginRight: 18,
              }}
            />
            SISTEMA NACIONAL
          </div>

          <div
            style={{
              // Orbitron is much wider than Geist per character, so the
              // wordmark steps down to stay inside the 660px column.
              fontFamily: "Orbitron",
              fontSize: 104,
              letterSpacing: -2,
              lineHeight: 1.15,
              marginTop: 18,
            }}
          >
            {SITE_NAME}
          </div>

          <div
            style={{
              width: 300,
              height: 5,
              marginTop: 6,
              borderRadius: 3,
              backgroundImage: `linear-gradient(90deg, ${RED}, transparent)`,
            }}
          />

          <div
            style={{
              fontSize: 34,
              color: "#94a3b8",
              marginTop: 26,
              lineHeight: 1.35,
            }}
          >
            Gen I–IX · estadísticas, debilidades, evoluciones, equipos y
            combates.
          </div>
        </div>

        {/* Poké Ball dibujada con divs: satori no ejecuta SVG externo. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 372,
            height: 372,
            borderRadius: 186,
            border: `14px solid ${INK}`,
            overflow: "hidden",
            position: "relative",
            boxShadow: `0 0 90px rgba(238,21,21,0.55)`,
          }}
        >
          <div style={{ display: "flex", flex: 1, backgroundColor: RED }} />
          <div style={{ display: "flex", height: 18, backgroundColor: INK }} />
          <div style={{ display: "flex", flex: 1, backgroundColor: "#f8fafc" }} />
          <div
            style={{
              position: "absolute",
              top: 122,
              left: 122,
              width: 100,
              height: 100,
              borderRadius: 50,
              border: `16px solid ${INK}`,
              backgroundColor: "#f8fafc",
            }}
          />
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
