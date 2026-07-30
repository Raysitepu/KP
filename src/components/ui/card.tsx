import { cn } from "@/utils/cn";
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#496b57]/15 bg-white p-5 shadow-sm shadow-stone-900/[.03]",
        className,
      )}
      {...props}
    />
  );
}
