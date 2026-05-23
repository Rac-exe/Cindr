import type { CSSProperties } from "react";

function FilmReel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="41" stroke="currentColor" strokeWidth="2.25" />
      <circle cx="60" cy="60" r="9" fill="currentColor" />
      <circle cx="60" cy="20" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="100" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="60" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="60" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="88" cy="32" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="88" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="88" cy="88" r="5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function FilmStrip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 260" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="45" height="257" rx="3" stroke="currentColor" strokeWidth="2.5" />
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i}>
          <rect x="5" y={10 + i * 20} width="8" height="6" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
          <rect x="35" y={10 + i * 20} width="8" height="6" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
          <line x1="15" y1={21 + i * 20} x2="33" y2={21 + i * 20} stroke="currentColor" strokeWidth="1" opacity="0.65" />
        </g>
      ))}
    </svg>
  );
}

function Clapperboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 80" fill="none" aria-hidden="true">
      <rect x="5" y="25" width="90" height="50" rx="5" stroke="currentColor" strokeWidth="3" />
      <path d="M5 29V18a4 4 0 0 1 4-4h82a4 4 0 0 1 4 4v11" stroke="currentColor" strokeWidth="3" />
      <path d="M20 14l8 15M38 14l8 15M56 14l8 15M74 14l8 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="11" cy="22" r="3.5" fill="currentColor" />
    </svg>
  );
}

function PlayButton({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <circle cx="30" cy="30" r="27" stroke="currentColor" strokeWidth="3" />
      <path d="M24 18.5 42 30 24 41.5v-23Z" fill="currentColor" />
    </svg>
  );
}

function Projector({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 86" fill="none" aria-hidden="true">
      <rect x="34" y="34" width="56" height="34" rx="6" stroke="currentColor" strokeWidth="3" />
      <circle cx="28" cy="24" r="18" stroke="currentColor" strokeWidth="2.75" />
      <circle cx="70" cy="20" r="16" stroke="currentColor" strokeWidth="2.75" />
      <circle cx="28" cy="24" r="4.5" fill="currentColor" />
      <circle cx="70" cy="20" r="4.5" fill="currentColor" />
      <path d="M90 43h18l6 8-6 8H90" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M44 68l-8 14M78 68l8 14M54 68v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Ticket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 64" fill="none" aria-hidden="true">
      <path
        d="M8 16a8 8 0 0 1 8-8h88a8 8 0 0 1 8 8v8a8 8 0 0 0 0 16v8a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8v-8a8 8 0 0 0 0-16v-8Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M42 10v44" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M58 24h34M58 39h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function QuestionMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="4" />
      <path
        d="M36 37c1.2-8.2 6.8-13.5 15.5-13.5 9 0 15 5.4 15 13 0 6.8-3.8 10.1-9.2 13.8-4.9 3.4-7.4 6.1-7.4 11.3v1.5"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="73" r="4" fill="currentColor" />
    </svg>
  );
}

function PopcornBucket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 112" fill="none" aria-hidden="true">
      <path d="M20 39h56l-7 60H27L20 39Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M32 46l4 46M48 46v46M64 46l-4 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.72" />
      <path d="M27 38c-5-3.7-4-12 2.8-14 4.3-1.3 7.4.3 9.3 3.1C40.5 19.5 47 16 53.2 18.7c4.2 1.8 6 5.2 6.4 8.6 3.3-3 8.6-3.2 12.2.2 3.5 3.3 3.4 8.4.2 11.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 60h28M36 76h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 39h48" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Dice({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path d="M22 22h52v52H22V22Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M31 22 42 10h46v50L74 74" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" opacity="0.7" />
      <path d="M74 22 88 10M74 74l14-14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      <circle cx="38" cy="38" r="4" fill="currentColor" />
      <circle cx="58" cy="38" r="4" fill="currentColor" />
      <circle cx="48" cy="58" r="4" fill="currentColor" />
    </svg>
  );
}

function ShuffleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 110 72" fill="none" aria-hidden="true">
      <path d="M10 19h19c18 0 23 34 45 34h17" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M76 10l17 9-17 9M76 44l17 9-17 9" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 53h19c8 0 14-5 20-14M58 29c5-7 10-10 17-10h16" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.62" />
    </svg>
  );
}

const RANDOM_RINGS = [
  { size: "16rem", delay: "0ms" },
  { size: "26rem", delay: "95ms" },
  { size: "38rem", delay: "190ms" },
  { size: "52rem", delay: "285ms" },
  { size: "68rem", delay: "380ms" },
];

export default function CinematicBackdrop({
  density = "balanced",
  mode = "taste",
}: {
  density?: "subtle" | "balanced";
  mode?: "taste" | "random";
}) {
  const isSubtle = density === "subtle";
  const isRandom = mode === "random";
  const drawingOpacity = isSubtle ? "opacity-[0.16]" : "opacity-[0.24]";
  const faintOpacity = isSubtle ? "opacity-[0.09]" : "opacity-[0.16]";
  const drawingTone = "text-[#D85A30]/80";
  const swapTiming = "transition-[opacity,transform] duration-200 ease-out";
  const lightTiming = "transition-opacity duration-200 ease-out";
  const tasteActive = isRandom ? "opacity-0 scale-0" : "opacity-100 scale-100";
  const randomActive = isRandom ? "opacity-100 scale-100" : "opacity-0 scale-0";

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div
        className={`absolute inset-0 ${lightTiming} ${
          isRandom ? "opacity-0" : "opacity-100"
        } bg-[radial-gradient(ellipse_at_50%_-4%,rgba(255,219,184,0.34),rgba(216,90,48,0.18)_20%,rgba(216,90,48,0.06)_42%,transparent_66%),radial-gradient(circle_at_88%_18%,rgba(112,66,44,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_38%)]`}
      />
      <div
        className={`absolute inset-0 ${lightTiming} ${
          isRandom ? "opacity-100" : "opacity-0"
        } bg-[radial-gradient(ellipse_at_50%_-4%,rgba(255,255,255,0.34),rgba(203,213,225,0.16)_24%,rgba(148,163,184,0.06)_48%,transparent_70%),radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.09),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_42%)]`}
      />
      <div
        className={`absolute left-1/2 top-0 h-[7rem] w-[24rem] -translate-x-1/2 rounded-b-full blur-2xl ${lightTiming} ${
          isRandom ? "bg-white/24 opacity-100" : "bg-orange-200/24 opacity-100"
        }`}
      />
      <div
        className={`absolute left-1/2 top-[3.5rem] h-[42rem] w-[34rem] -translate-x-1/2 opacity-80 ${lightTiming} ${
          isRandom
            ? "bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),rgba(203,213,225,0.08)_28%,transparent_68%)]"
            : "bg-[radial-gradient(ellipse_at_top,rgba(255,204,153,0.18),rgba(216,90,48,0.07)_30%,transparent_68%)]"
        }`}
      />
      <div
        className={`absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,90,48,0.075),transparent_66%)] blur-2xl ${
          isRandom ? "opacity-0" : isSubtle ? "opacity-45" : "opacity-75"
        } ${lightTiming}`}
      />
      <div
        className={`absolute left-1/2 top-0 h-[34rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.12),rgba(148,163,184,0.06)_42%,transparent_70%)] blur-2xl transition-opacity duration-700 ease-out ${
          isRandom ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_46%,rgba(255,255,255,0.035)_47%,transparent_49%,transparent_100%)] opacity-40" />
      <div className={`cinema-grid-stage ${isRandom ? "cinema-grid-out" : "cinema-grid-in"}`} />
      <div className={`cinema-ring-stage ${isRandom ? "cinema-rings-in" : "cinema-rings-out"}`}>
        {RANDOM_RINGS.map((ring) => (
          <span
            key={ring.size}
            className="cinema-ring"
            style={
              {
                "--ring-size": ring.size,
                "--ring-delay": ring.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className={`absolute inset-0 ${drawingTone} origin-center ${swapTiming} ${tasteActive}`}>
        <FilmReel className={`cinema-reel-slow absolute -right-10 -top-8 h-48 w-48 ${drawingOpacity} [--cinema-speed:56s]`} />
        <FilmReel className={`cinema-reel-slow absolute -bottom-12 -left-10 h-40 w-40 ${drawingOpacity} [--cinema-speed:64s] [animation-direction:reverse]`} />
        <FilmReel className={`cinema-reel-slow absolute right-[-2rem] top-[34%] h-24 w-24 ${faintOpacity} [--cinema-speed:48s] md:right-[9%] md:top-[55%]`} />
        <FilmReel className={`cinema-reel-slow absolute left-[-1.75rem] top-[26%] h-20 w-20 ${faintOpacity} [--cinema-speed:52s] [animation-direction:reverse] md:left-[7%] md:top-[24%]`} />

        <FilmStrip className={`cinema-drift absolute left-2 top-[58%] w-6 ${faintOpacity} [--cinema-drift-speed:18s] md:w-7 lg:left-5 lg:top-20 lg:${drawingOpacity}`} />
        <FilmStrip className={`cinema-drift absolute right-2 top-[18%] w-6 ${faintOpacity} [--cinema-drift-speed:20s] md:w-7 lg:right-6 lg:top-24`} />
        <FilmStrip className={`cinema-drift absolute bottom-8 left-[28%] hidden w-6 ${faintOpacity} [--cinema-drift-speed:22s] [--cinema-rotate:8deg] xl:block`} />

        <Clapperboard className={`cinema-drift absolute left-[6%] top-[16%] w-16 ${faintOpacity} [--cinema-drift-speed:19s] [--cinema-rotate:-12deg] sm:left-[16%] sm:top-[15%] sm:w-24`} />
        <Clapperboard className={`cinema-drift absolute bottom-[20%] right-[12%] hidden w-20 ${faintOpacity} [--cinema-drift-speed:21s] [--cinema-rotate:6deg] sm:block`} />
        <PlayButton className={`cinema-drift absolute right-4 top-[44%] w-10 ${drawingOpacity} [--cinema-drift-speed:17s] sm:right-[21%] sm:top-[33%] sm:w-12`} />
        <PlayButton className={`cinema-drift absolute bottom-[22%] left-4 w-9 ${faintOpacity} [--cinema-drift-speed:23s] md:bottom-[34%] md:left-[24%] md:w-10`} />
        <Projector className={`cinema-drift absolute right-[10%] top-[14%] hidden w-28 ${faintOpacity} [--cinema-drift-speed:20s] [--cinema-rotate:-3deg] lg:block`} />
        <Ticket className={`cinema-drift absolute bottom-[24%] right-[30%] hidden w-28 ${faintOpacity} [--cinema-drift-speed:24s] [--cinema-rotate:-6deg] xl:block`} />
      </div>
      <div className={`absolute inset-0 origin-center text-slate-100/70 ${swapTiming} ${randomActive}`}>
        <QuestionMark className="cinema-random-orbit absolute right-[-1rem] top-[18%] h-24 w-24 opacity-[0.2] [--random-speed:34s] md:right-[8%] md:h-28 md:w-28" />
        <QuestionMark className="cinema-random-orbit absolute bottom-[18%] left-[-1rem] h-20 w-20 opacity-[0.16] [--random-speed:42s] [animation-direction:reverse] md:bottom-[12%] md:left-[10%]" />
        <PopcornBucket className="cinema-drift absolute left-3 top-[30%] w-18 opacity-[0.18] [--cinema-drift-speed:19s] [--cinema-rotate:-8deg] sm:left-[14%] sm:top-[21%] sm:w-24" />
        <Dice className="cinema-random-orbit absolute right-3 bottom-[22%] w-20 opacity-[0.18] [--random-speed:38s] md:right-[18%] md:bottom-[20%] md:w-24" />
        <ShuffleMark className="cinema-drift absolute left-[40%] top-[14%] hidden w-28 opacity-[0.14] [--cinema-drift-speed:21s] [--cinema-rotate:5deg] lg:block" />
        <PopcornBucket className="cinema-drift absolute bottom-[26%] right-[38%] hidden w-20 opacity-[0.12] [--cinema-drift-speed:24s] [--cinema-rotate:10deg] xl:block" />
        <Dice className="cinema-random-orbit absolute left-[23%] bottom-[16%] hidden w-16 opacity-[0.12] [--random-speed:46s] [animation-direction:reverse] lg:block" />
      </div>
    </div>
  );
}
