import { typeColor, typeLabel } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md";
}

export function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium ring-1 ring-inset",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-sm",
        typeColor(type),
      )}
    >
      {typeLabel(type)}
    </span>
  );
}
