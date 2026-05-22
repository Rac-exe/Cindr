"use client";

interface SwipeActionsProps {
  onSkip: () => void;
  onLike: () => void;
  onOpenTrailer?: () => void;
  dragDirection?: "left" | "right" | null;
}

export default function SwipeActions({ onSkip, onLike, onOpenTrailer, dragDirection }: SwipeActionsProps) {
  const skipActive = dragDirection === "left";
  const likeActive = dragDirection === "right";

  return (
    <div className="absolute -bottom-[4.5rem] left-0 right-0 z-20 flex flex-col items-center gap-2 sm:-bottom-[5.5rem]">
      {/* Trailer button — center, above skip/like */}
      {onOpenTrailer && (
        <button
          onClick={onOpenTrailer}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#111015]/80 px-4 py-1.5 text-[11px] font-semibold text-white/55 backdrop-blur-md transition-all hover:border-white/30 hover:text-white/85 hover:bg-white/[0.08]"
          aria-label="Watch trailer"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          Trailer
        </button>
      )}
      <div className="flex items-center gap-5 sm:gap-6">
      <button
        onClick={onSkip}
        style={{
          transform: skipActive ? "scale(1.18)" : undefined,
          transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
          boxShadow: skipActive ? "0 0 28px rgba(248,113,113,0.55), 0 18px 50px rgba(0,0,0,0.45)" : "0 18px 50px rgba(0,0,0,0.45)",
        }}
        className={`grid h-14 w-14 place-items-center rounded-full backdrop-blur-md hover:scale-105 active:scale-[0.96] sm:h-15 sm:w-15 ${
          skipActive
            ? "border-2 border-red-400 bg-red-500/20 text-red-300"
            : "border border-red-400/45 bg-[#14141b]/90 text-red-300"
        }`}
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
        style={{
          transform: likeActive ? "scale(1.18)" : undefined,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          boxShadow: likeActive
            ? "0 0 40px rgba(216,90,48,0.65), 0 18px_50px_rgba(0,0,0,0.45)"
            : "0 0 28px rgba(216,90,48,0.38), 0 18px 50px rgba(0,0,0,0.45)",
        }}
        className="grid h-16 w-16 place-items-center rounded-full border border-[var(--color-cindr)]/60 bg-[var(--color-cindr)] text-white hover:scale-105 active:scale-[0.96] sm:h-17 sm:w-17"
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
    </div>
  );
}
