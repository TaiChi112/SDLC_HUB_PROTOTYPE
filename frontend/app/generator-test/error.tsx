'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function GeneratorTestError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('generator-test route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-rose-500 mt-0.5" size={20} />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Temporary service issue</h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              We couldn&apos;t load this page. If the database is down, please try again in a moment.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={reset}
            className="px-3 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-3 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
