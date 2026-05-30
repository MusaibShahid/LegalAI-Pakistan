"use client";

interface PaginationProps {
  currentPage: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, total, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push("...");
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-zinc-600 transition-colors hover:bg-pk-green-50 disabled:cursor-not-allowed disabled:text-zinc-300 dark:text-pk-green-300 dark:hover:bg-pk-green-900 dark:disabled:text-pk-green-700"
        aria-label="Previous page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-zinc-400 dark:text-pk-green-500">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-pk-green-600 text-white hover:bg-pk-green-700 dark:bg-pk-green-500 dark:text-pk-green-950 dark:hover:bg-pk-green-400"
                : "text-zinc-600 hover:bg-pk-green-50 dark:text-pk-green-300 dark:hover:bg-pk-green-900"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-zinc-600 transition-colors hover:bg-pk-green-50 disabled:cursor-not-allowed disabled:text-zinc-300 dark:text-pk-green-300 dark:hover:bg-pk-green-900 dark:disabled:text-pk-green-700"
        aria-label="Next page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
