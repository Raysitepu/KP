import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "blue",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?:
    | "blue"
    | "orange"
    | "emerald"
    | "violet"
    | "cyan"
    | "amber"
    | "red"
    | "indigo";
}) {
  const tones = {
    blue: {
      accent: "from-[#438db5] to-[#245f8d]",
      icon: "bg-sky-50 text-[#2d6f9f]",
    },
    orange: {
      accent: "from-[#d7835f] to-[#a95f43]",
      icon: "bg-[#fbede5] text-[#9f5f45]",
    },
    emerald: {
      accent: "from-emerald-500 to-teal-600",
      icon: "bg-emerald-50 text-emerald-700",
    },
    violet: {
      accent: "from-violet-500 to-indigo-600",
      icon: "bg-violet-50 text-violet-700",
    },
    cyan: {
      accent: "from-teal-400 to-emerald-600",
      icon: "bg-teal-50 text-teal-700",
    },
    amber: {
      accent: "from-amber-400 to-orange-500",
      icon: "bg-amber-50 text-amber-700",
    },
    red: { accent: "from-red-500 to-rose-700", icon: "bg-red-50 text-red-700" },
    indigo: {
      accent: "from-indigo-500 to-[#245f8d]",
      icon: "bg-indigo-50 text-indigo-700",
    },
  } as const;
  const colors = tones[tone];
  return (
    <Card className="group relative min-h-36 overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <span
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors.accent}`}
      />
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
          {label}
        </span>
        <span className={`rounded-xl p-2.5 ${colors.icon}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </Card>
  );
}
