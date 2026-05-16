"use client";

interface SwipeActionsProps {
  onSkip: () => void;
  onLike: () => void;
}

export default function SwipeActions({ onSkip, onLike }: SwipeActionsProps) {
  return (
    <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-6 z-20">
      <button
        onClick={onSkip}
        className="w-14 h-14 rounded-full border-2 border-red-500/40 bg-[var(--surface)] flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors active:scale-95"
        aria-label="Skip"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <button
        onClick={onLike}
        className="w-16 h-16 rounded-full border-2 border-green-500/40 bg-[var(--surface)] flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-colors active:scale-95"
        aria-label="Watch trailer"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>
  );
}
