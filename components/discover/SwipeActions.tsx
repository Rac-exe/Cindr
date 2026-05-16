"use client";

interface SwipeActionsProps {
  onSkip: () => void;
  onLike: () => void;
}

export default function SwipeActions({ onSkip, onLike }: SwipeActionsProps) {
  return (
    <div className="absolute -bottom-20 left-0 right-0 flex items-center justify-center gap-5 z-20">
      <button
        onClick={onSkip}
        className="grid h-15 w-15 place-items-center rounded-full border border-red-400/45 bg-[#14141b]/90 text-red-300 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md transition-transform duration-200 hover:scale-105 active:scale-[0.96]"
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
        className="grid h-17 w-17 place-items-center rounded-full border border-[var(--color-cindr)]/60 bg-[var(--color-cindr)] text-white shadow-[0_0_28px_rgba(216,90,48,0.38),0_18px_50px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:scale-105 active:scale-[0.96]"
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
