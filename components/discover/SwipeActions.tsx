"use client";

interface SwipeActionsProps {
  onSkip: () => void;
  onLike: () => void;
  onOpenTrailer?: () => void;
  dragDirection?: "left" | "right" | "up" | null;
  trailerOpen?: boolean;
}

export default function SwipeActions({ onSkip, onLike, onOpenTrailer, dragDirection, trailerOpen }: SwipeActionsProps) {
  const skipActive = dragDirection === "left";
  const likeActive = dragDirection === "right";
  const trailerActive = dragDirection === "up" || trailerOpen;

  return (
    <div className="absolute -bottom-[4.15rem] left-0 right-0 z-20 flex items-center justify-center gap-3 sm:-bottom-[5rem] sm:gap-5">
      {/* Skip */}
      <button
        onClick={onSkip}
        style={{
          transform: skipActive ? "scale(1.18)" : undefined,
          transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
          boxShadow: skipActive
            ? "0 0 28px rgba(248,113,113,0.55), 0 18px 50px rgba(0,0,0,0.45)"
            : "0 18px 50px rgba(0,0,0,0.45)",
        }}
        className={`grid h-[3.25rem] w-[3.25rem] place-items-center rounded-full backdrop-blur-md hover:scale-105 active:scale-[0.96] sm:h-[3.75rem] sm:w-[3.75rem] ${
          skipActive
            ? "border-2 border-red-400 bg-red-500/20 text-red-300"
            : "border border-red-400/45 bg-[#14141b]/90 text-red-300"
        }`}
        aria-label="Skip"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Trailer — center pill */}
      {onOpenTrailer ? (
        <button
          onClick={onOpenTrailer}
          style={{
            transform: trailerActive ? "scale(1.12)" : undefined,
            boxShadow: trailerActive
              ? "0 0 0 1.5px rgba(216,90,48,0.9) inset, 0 0 36px rgba(216,90,48,0.55), 0 12px 32px rgba(0,0,0,0.4)"
              : "0 0 0 1px rgba(216,90,48,0.35) inset, 0 0 18px rgba(216,90,48,0.18), 0 12px 32px rgba(0,0,0,0.4)",
            transition: "box-shadow 0.2s ease, background 0.2s ease, transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!trailerActive)
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 0 1px rgba(216,90,48,0.6) inset, 0 0 28px rgba(216,90,48,0.35), 0 12px 32px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            if (!trailerActive)
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 0 1px rgba(216,90,48,0.35) inset, 0 0 18px rgba(216,90,48,0.18), 0 12px 32px rgba(0,0,0,0.4)";
          }}
          className={`flex h-11 items-center gap-1.5 rounded-full px-4 backdrop-blur-md hover:scale-105 active:scale-[0.96] sm:h-12 sm:gap-2 sm:px-5 ${
            trailerActive ? "bg-[var(--color-cindr)]/20" : "bg-[var(--color-cindr)]/10"
          }`}
          aria-label="Watch trailer"
        >
          {/* Play triangle */}
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-cindr)]/20">
            <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" className="translate-x-[1px] text-[var(--color-cindr)]">
              <path d="M8.5 5L0.5 0.669873V9.33013L8.5 5Z" />
            </svg>
          </span>
          <span className="text-[11px] font-semibold tracking-wide text-[var(--color-cindr)]">Trailer</span>
        </button>
      ) : null}

      {/* Like */}
      <button
        onClick={onLike}
        style={{
          transform: likeActive ? "scale(1.18)" : undefined,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          boxShadow: likeActive
            ? "0 0 40px rgba(216,90,48,0.65), 0 18px 50px rgba(0,0,0,0.45)"
            : "0 0 28px rgba(216,90,48,0.38), 0 18px 50px rgba(0,0,0,0.45)",
        }}
        className="grid h-[3.75rem] w-[3.75rem] place-items-center rounded-full border border-[var(--color-cindr)]/60 bg-[var(--color-cindr)] text-white hover:scale-105 active:scale-[0.96] sm:h-[4.25rem] sm:w-[4.25rem]"
        aria-label="Add to your reel"
      >
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
