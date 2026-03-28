'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 font-[family-name:var(--font-bangla)]">
      <h2 className="text-2xl font-semibold">কিছু একটা সমস্যা হয়েছে</h2>
      <p className="text-[var(--text-secondary)]">
        দুঃখিত, একটি ত্রুটি ঘটেছে।
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[var(--text-primary)] px-6 py-2 text-[var(--bg-primary)] transition-opacity hover:opacity-80"
      >
        আবার চেষ্টা করুন
      </button>
    </div>
  );
}
