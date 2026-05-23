"use client";

interface SwipeActionsProps {
  onSkip: () => void;
  onLike: () => void;
  onOpenTrailer?: () => void;
  dragDirection?: "left" | "right" | "up" | null;
  trailerOpen?: boolean;
  randomMode?: boolean;
}

export default function SwipeActions({ onSkip, onLike, onOpenTrailer, dragDirection, trailerOpen, randomMode }: SwipeActionsProps) {
  const skipActive = dragDirection === "left";
  const likeActive = dragDirection === "right";
  const trailerActive = dragDirection === "up" || trailerOpen;
  const accentRgb = randomMode ? "226,232,240" : "216,90,48";
  const accentText = randomMode ? "text-slate-100" : "text-[var(--color-cindr)]";

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <button
        onClick={onSkip}
        style={{
          transform: skipActive ? "scale(1.025)" : undefined,
          transition: "transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: skipActive
            ? "0 18px 50px rgba(0,0,0,0.42)"
            : "0 14px 38px rgba(0,0,0,0.36)",
        }}
        className={`grid h-[3.25rem] w-[3.25rem] place-items-center rounded-full backdrop-blur-md transition-transform duration-200 ease-out hover:scale-[1.015] active:scale-[0.98] sm:h-14 sm:w-14 ${
          skipActive
            ? "border border-red-300/70 bg-red-500/16 text-red-200"
            : "border border-white/10 bg-[#14141b]/90 text-white/70 hover:border-red-300/35 hover:text-red-200"
        }`}
        aria-label="Skip"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      {onOpenTrailer ? (
        <button
          onClick={onOpenTrailer}
          style={{
            transform: trailerActive ? "scale(1.018)" : undefined,
            boxShadow: trailerActive
              ? `0 0 0 1px rgba(${accentRgb},0.72) inset, 0 12px 32px rgba(0,0,0,0.38)`
              : "0 0 0 1px rgba(255,255,255,0.1) inset, 0 12px 32px rgba(0,0,0,0.32)",
            transition: "box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), background 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={(e) => {
            if (!trailerActive)
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                `0 0 0 1px rgba(${accentRgb},0.45) inset, 0 12px 32px rgba(0,0,0,0.36)`;
          }}
          onMouseLeave={(e) => {
            if (!trailerActive)
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 0 1px rgba(255,255,255,0.1) inset, 0 12px 32px rgba(0,0,0,0.32)";
          }}
          className={`flex h-11 items-center gap-2 rounded-full px-4 backdrop-blur-md transition-transform duration-200 ease-out hover:scale-[1.015] active:scale-[0.98] sm:h-12 sm:px-5 ${
            trailerActive
              ? randomMode
                ? "bg-white/12"
                : "bg-[var(--color-cindr)]/18"
              : "bg-white/[0.045]"
          }`}
          aria-label="Watch trailer"
        >
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${randomMode ? "bg-white/14" : "bg-[var(--color-cindr)]/20"}`}>
            <svg width="10" height="10" viewBox="0 0 9 10" fill="currentColor" className={`translate-x-[1px] ${accentText}`}>
              <path d="M8.5 5L0.5 0.669873V9.33013L8.5 5Z" />
            </svg>
          </span>
          <span className={`text-[11px] font-semibold tracking-wide ${accentText}`}>Trailer</span>
        </button>
      ) : null}
      <button
        onClick={onLike}
        style={{
          transform: likeActive ? "scale(1.03)" : undefined,
          transition: "transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: likeActive
            ? `0 18px 48px rgba(${accentRgb},0.18), 0 18px 50px rgba(0,0,0,0.42)`
            : "0 18px 50px rgba(0,0,0,0.42)",
        }}
        className={`grid h-[3.75rem] w-[3.75rem] place-items-center rounded-full border text-white transition-transform duration-200 ease-out hover:scale-[1.015] active:scale-[0.98] sm:h-16 sm:w-16 ${
          randomMode
            ? "border-white/25 bg-slate-100/90 text-zinc-950"
            : "border-[var(--color-cindr)]/45 bg-[var(--color-cindr)] text-white"
        }`}
        aria-label="Add to your reel"
      >
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
