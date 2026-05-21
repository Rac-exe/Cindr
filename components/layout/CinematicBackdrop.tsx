function FilmReel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="2.75" />
      <circle cx="60" cy="60" r="10" fill="currentColor" />
      <circle cx="60" cy="18" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="102" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="18" cy="60" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="102" cy="60" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="30" cy="30" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="90" cy="30" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="30" cy="90" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="90" cy="90" r="6" stroke="currentColor" strokeWidth="2.5" />
      <line x1="60" y1="18" x2="60" y2="48" stroke="currentColor" strokeWidth="2" />
      <line x1="60" y1="72" x2="60" y2="102" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="60" x2="48" y2="60" stroke="currentColor" strokeWidth="2" />
      <line x1="72" y1="60" x2="102" y2="60" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function FilmStrip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 260" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="46" height="258" rx="3" stroke="currentColor" strokeWidth="3" />
      {Array.from({ length: 13 }).map((_, i) => (
        <g key={i}>
          <rect x="4" y={8 + i * 20} width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="35" y={8 + i * 20} width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <line x1="14" y1={20 + i * 20} x2="34" y2={20 + i * 20} stroke="currentColor" strokeWidth="1.25" opacity="0.75" />
        </g>
      ))}
    </svg>
  );
}

function Clapperboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 80" fill="none" aria-hidden="true">
      <rect x="4" y="24" width="92" height="52" rx="4" stroke="currentColor" strokeWidth="3.5" />
      <path d="M4 28V18a4 4 0 0 1 4-4h84a4 4 0 0 1 4 4v10" stroke="currentColor" strokeWidth="3.5" />
      <line x1="20" y1="14" x2="28" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="38" y1="14" x2="46" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="56" y1="14" x2="64" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="74" y1="14" x2="82" y2="28" stroke="currentColor" strokeWidth="3" />
      <circle cx="10" cy="21" r="4" fill="currentColor" />
    </svg>
  );
}

function PlayButton({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="3.5" />
      <path d="M24 18l18 12-18 12V18z" fill="currentColor" />
    </svg>
  );
}

function Projector({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 86" fill="none" aria-hidden="true">
      <rect x="34" y="34" width="56" height="34" rx="6" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="28" cy="24" r="18" stroke="currentColor" strokeWidth="3.25" />
      <circle cx="70" cy="20" r="16" stroke="currentColor" strokeWidth="3.25" />
      <circle cx="28" cy="24" r="5" fill="currentColor" />
      <circle cx="70" cy="20" r="5" fill="currentColor" />
      <path d="M90 43h18l6 8-6 8H90" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M44 68l-8 14M78 68l8 14M54 68v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function TripodCamera({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 112 112" fill="none" aria-hidden="true">
      <rect x="18" y="26" width="58" height="36" rx="6" stroke="currentColor" strokeWidth="3.5" />
      <path d="M76 36l22-10v36L76 52" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="43" cy="44" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M47 62v14M47 76L24 104M47 76l24 28M47 76v28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Ticket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 64" fill="none" aria-hidden="true">
      <path
        d="M8 16a8 8 0 0 1 8-8h88a8 8 0 0 1 8 8v8a8 8 0 0 0 0 16v8a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8v-8a8 8 0 0 0 0-16v-8Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M42 10v44" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" />
      <path d="M58 24h34M58 39h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Spotlight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" aria-hidden="true">
      <path d="M28 16h44l10 48H18L28 16Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M26 64h48l-8 16H34l-8-16Z" stroke="currentColor" strokeWidth="3.25" strokeLinejoin="round" />
      <path d="M50 80v28M30 112h40M50 96l-20 16M50 96l20 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 28h32M30 42h40M26 56h48" stroke="currentColor" strokeWidth="2.5" opacity="0.8" />
    </svg>
  );
}

export default function CinematicBackdrop({
  density = "balanced",
}: {
  density?: "subtle" | "balanced";
}) {
  const isSubtle = density === "subtle";
  const neonGlow =
    "drop-shadow-[0_0_4px_rgba(216,90,48,0.8)] drop-shadow-[0_0_12px_rgba(216,90,48,0.45)]";
  const reelMotionA = "animate-[cindr-reel-drift_48s_linear_infinite] motion-reduce:animate-none";
  const reelMotionB = "animate-[cindr-reel-drift-reverse_62s_linear_infinite] motion-reduce:animate-none";
  const stripFloat = "animate-[cindr-film-float_18s_ease-in-out_infinite] motion-reduce:animate-none";

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden text-[#F0642F]" aria-hidden="true">
      <FilmReel className={`${isSubtle ? "opacity-50" : "opacity-85"} ${neonGlow} ${reelMotionA} absolute -right-8 -top-8 h-44 w-44 sm:h-52 sm:w-52`} />
      <FilmReel className={`${isSubtle ? "opacity-42" : "opacity-78"} ${neonGlow} ${reelMotionB} absolute -bottom-12 -left-10 h-40 w-40`} />
      <FilmReel className={`${isSubtle ? "opacity-32" : "opacity-58"} ${neonGlow} ${reelMotionB} absolute right-[8%] top-[58%] hidden h-24 w-24 md:block`} />
      <FilmReel className={`${isSubtle ? "opacity-30" : "opacity-54"} ${neonGlow} ${reelMotionA} absolute left-[7%] top-[24%] hidden h-20 w-20 md:block`} />
      <FilmReel className={`${isSubtle ? "opacity-22" : "opacity-42"} ${neonGlow} ${reelMotionB} absolute left-[49%] top-[37%] hidden h-16 w-16 md:block`} />
      <FilmReel className={`${isSubtle ? "opacity-18" : "opacity-34"} ${neonGlow} ${reelMotionA} absolute bottom-[11%] right-[43%] hidden h-14 w-14 lg:block`} />

      <FilmStrip className={`${isSubtle ? "opacity-36" : "opacity-70"} ${neonGlow} ${stripFloat} absolute left-4 top-6 hidden w-7 [--cinematic-tilt:0deg] lg:block`} />
      <FilmStrip className={`${isSubtle ? "opacity-30" : "opacity-58"} ${neonGlow} ${stripFloat} absolute right-5 top-20 hidden w-7 [--cinematic-tilt:0deg] [animation-delay:-6s] lg:block`} />
      <FilmStrip className={`${isSubtle ? "opacity-24" : "opacity-46"} ${neonGlow} ${stripFloat} absolute bottom-4 left-[28%] hidden w-6 [--cinematic-tilt:8deg] [animation-delay:-3s] lg:block`} />
      <FilmStrip className={`${isSubtle ? "opacity-20" : "opacity-38"} ${neonGlow} ${stripFloat} absolute right-[36%] top-4 hidden w-5 [--cinematic-tilt:-6deg] [animation-delay:-9s] lg:block`} />
      <FilmStrip className={`${isSubtle ? "opacity-18" : "opacity-36"} ${neonGlow} ${stripFloat} absolute bottom-[18%] right-[18%] hidden w-6 [--cinematic-tilt:11deg] [animation-delay:-12s] lg:block`} />
      <FilmStrip className={`${isSubtle ? "opacity-16" : "opacity-32"} ${neonGlow} ${stripFloat} absolute left-[58%] top-[12%] hidden w-5 [--cinematic-tilt:16deg] [animation-delay:-15s] xl:block`} />

      <Clapperboard className={`${isSubtle ? "opacity-28" : "opacity-54"} ${neonGlow} absolute left-[16%] top-[13%] hidden w-24 -rotate-12 sm:block`} />
      <Clapperboard className={`${isSubtle ? "opacity-24" : "opacity-46"} ${neonGlow} absolute bottom-[18%] right-[11%] hidden w-20 rotate-6 sm:block`} />
      <Clapperboard className={`${isSubtle ? "opacity-18" : "opacity-34"} ${neonGlow} absolute left-[52%] top-[66%] hidden w-16 rotate-3 md:block`} />
      <Clapperboard className={`${isSubtle ? "opacity-16" : "opacity-32"} ${neonGlow} absolute left-[22%] bottom-[7%] hidden w-16 -rotate-6 md:block`} />

      <PlayButton className={`${isSubtle ? "opacity-32" : "opacity-62"} ${neonGlow} absolute right-[20%] top-[32%] hidden w-12 sm:block`} />
      <PlayButton className={`${isSubtle ? "opacity-24" : "opacity-48"} ${neonGlow} absolute bottom-[34%] left-[24%] hidden w-10 md:block`} />
      <PlayButton className={`${isSubtle ? "opacity-20" : "opacity-40"} ${neonGlow} absolute bottom-[14%] right-[28%] hidden w-11 md:block`} />
      <PlayButton className={`${isSubtle ? "opacity-16" : "opacity-32"} ${neonGlow} absolute top-[52%] left-[17%] hidden w-8 lg:block`} />

      <Projector className={`${isSubtle ? "opacity-22" : "opacity-45"} ${neonGlow} absolute right-[10%] top-[12%] hidden w-28 -rotate-3 lg:block`} />
      <Projector className={`${isSubtle ? "opacity-16" : "opacity-32"} ${neonGlow} absolute left-[12%] bottom-[20%] hidden w-24 rotate-6 xl:block`} />
      <TripodCamera className={`${isSubtle ? "opacity-20" : "opacity-40"} ${neonGlow} absolute left-[33%] top-[11%] hidden w-24 rotate-[-8deg] lg:block`} />
      <TripodCamera className={`${isSubtle ? "opacity-15" : "opacity-30"} ${neonGlow} absolute bottom-[9%] right-[34%] hidden w-20 rotate-[7deg] xl:block`} />
      <Ticket className={`${isSubtle ? "opacity-20" : "opacity-38"} ${neonGlow} absolute right-[30%] bottom-[24%] hidden w-28 rotate-[-10deg] lg:block`} />
      <Ticket className={`${isSubtle ? "opacity-15" : "opacity-30"} ${neonGlow} absolute left-[10%] top-[48%] hidden w-24 rotate-[12deg] xl:block`} />
      <Spotlight className={`${isSubtle ? "opacity-18" : "opacity-36"} ${neonGlow} absolute right-[4%] bottom-[38%] hidden w-20 rotate-[-7deg] lg:block`} />
      <Spotlight className={`${isSubtle ? "opacity-13" : "opacity-28"} ${neonGlow} absolute left-[41%] bottom-[16%] hidden w-16 rotate-[8deg] xl:block`} />
    </div>
  );
}
