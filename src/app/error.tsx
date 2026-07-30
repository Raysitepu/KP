"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold">
          Dashboard belum dapat ditampilkan
        </h1>
        <p className="mt-3 text-slate-600">
          Terjadi kendala sementara. Silakan coba memuat ulang halaman.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-[#557a64] px-5 py-3 font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}
