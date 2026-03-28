import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 font-[family-name:var(--font-bangla)]">
      <h2 className="text-2xl font-semibold">পৃষ্ঠা পাওয়া যায়নি</h2>
      <p className="text-[var(--text-secondary)]">
        আপনি যে পৃষ্ঠাটি খুঁজছেন তা বিদ্যমান নেই।
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--text-primary)] px-6 py-2 text-[var(--bg-primary)] transition-opacity hover:opacity-80"
      >
        মূল পৃষ্ঠায় ফিরে যান
      </Link>
    </div>
  );
}
