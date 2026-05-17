"use client";

interface SwipeActionsProps {
  onSkip: () => void;
  onLike: () => void;
}

export default function SwipeActions({ onSkip, onLike }: SwipeActionsProps) {
  return (
    <div className="absolute -bottom-[4.5rem] left-0 right-0 flex items-center justify-center gap-4 z-20 sm:-bottom-20 sm:gap-5">
      <button
        onClick={onSkip}
        className="grid h-14 w-14 place-items-center rounded-full border border-red-400/45 bg-[#14141b]/90 text-red-300 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md transition-transform duration-200 hover:scale-105 active:scale-[0.96] sm:h-15 sm:w-15"
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
        className="grid h-16 w-16 place-items-center rounded-full border border-[var(--color-cindr)]/60 bg-[var(--color-cindr)] text-white shadow-[0_0_28px_rgba(216,90,48,0.38),0_18px_50px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:scale-105 active:scale-[0.96] sm:h-17 sm:w-17"
        aria-label="Add to your reel"
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 13.5h20v11.25A2.25 2.25 0 0 1 23.75 27H8.25A2.25 2.25 0 0 1 6 24.75V13.5Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M6.75 9.25 25.6 5.5l.65 3.25L7.4 12.5 6.75 9.25Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M10.25 8.55 13.2 12M15.55 7.5l2.95 3.45M20.85 6.45l2.95 3.45M11 18h5.25M11 22h9.75"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
