import type { Metadata } from "next";
import { BattleScreen } from "@/components/battle/BattleScreen";

export const metadata: Metadata = {
  title: "Modo Combate",
  description:
    "Combate Pokémon contra un Entrenador generado por IA: arena 3D, diálogo en tiempo real y decisiones tácticas turno a turno.",
};

/**
 * Arena del Modo Combate. Todo el estado vive en el cliente (equipo desde
 * localStorage + motor de combate); el servidor solo aporta las rutas de IA.
 */
export default function BattlePage() {
  return (
    <main className="w-full">
      <BattleScreen />
    </main>
  );
}
