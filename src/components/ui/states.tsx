import { AlertCircle, CloudOff, LoaderCircle } from "lucide-react";
export function Skeleton({ className = "h-28" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-200 ${className}`}
      aria-label="Memuat"
      role="status"
    />
  );
}
export function EmptyState({
  message = "Data belum tersedia.",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-slate-500">
      <CloudOff />
      <p>{message}</p>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl bg-red-50 p-6 text-center text-red-800"
    >
      <AlertCircle />
      <p>{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}
export function LoadingInline() {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <LoaderCircle className="size-4 animate-spin" /> Memuat
    </span>
  );
}
