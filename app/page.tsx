import Link from "next/link";

function FilmReel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="2.75" />
      <circle cx="60" cy="60" r="10" fill="currentColor" />
      {/* Sprocket holes */}
      <circle cx="60" cy="18" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="102" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="18" cy="60" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="102" cy="60" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="30" cy="30" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="90" cy="30" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="30" cy="90" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="90" cy="90" r="6" stroke="currentColor" strokeWidth="2.5" />
      {/* Spokes */}
      <line x1="60" y1="18" x2="60" y2="48" stroke="currentColor" strokeWidth="2" />
      <line x1="60" y1="72" x2="60" y2="102" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="60" x2="48" y2="60" stroke="currentColor" strokeWidth="2" />
      <line x1="72" y1="60" x2="102" y2="60" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function FilmStrip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="46" height="258" rx="3" stroke="currentColor" strokeWidth="3" />
      {/* Sprocket holes left & right, repeated */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <g key={i}>
          <rect x="4" y={8 + i * 20} width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="35" y={8 + i * 20} width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
        </g>
      ))}
      {/* Frame lines */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <line key={`f${i}`} x1="14" y1={20 + i * 20} x2="34" y2={20 + i * 20} stroke="currentColor" strokeWidth="1.25" opacity="0.75" />
      ))}
    </svg>
  );
}

function Clapperboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Board body */}
      <rect x="4" y="24" width="92" height="52" rx="4" stroke="currentColor" strokeWidth="3.5" />
      {/* Top clapper */}
      <path d="M4 28L4 18a4 4 0 014-4h84a4 4 0 014 4v10" stroke="currentColor" strokeWidth="3.5" />
      {/* Stripe lines on clapper */}
      <line x1="20" y1="14" x2="28" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="38" y1="14" x2="46" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="56" y1="14" x2="64" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="74" y1="14" x2="82" y2="28" stroke="currentColor" strokeWidth="3" />
      {/* Hinge circle */}
      <circle cx="10" cy="21" r="4" fill="currentColor" />
    </svg>
  );
}

function PlayButton({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="3.5" />
      <path d="M24 18l18 12-18 12V18z" fill="currentColor" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Cinematic decorations spread across the whole page */}
      <div className="pointer-events-none absolute inset-0 text-[#F0642F] drop-shadow-[0_0_4px_rgba(216,90,48,0.8)] drop-shadow-[0_0_12px_rgba(216,90,48,0.45)]">
        {/* Film reels */}
        <FilmReel className="absolute -top-6 -right-6 w-44 h-44 opacity-85 sm:w-52 sm:h-52" />
        <FilmReel className="absolute -bottom-10 -left-10 w-40 h-40 opacity-75" />
        <FilmReel className="absolute top-[55%] right-[8%] w-24 h-24 opacity-60 hidden md:block" />
        <FilmReel className="absolute top-[20%] left-[5%] w-20 h-20 opacity-55 hidden md:block" />
        <FilmReel className="absolute top-[80%] left-[40%] w-16 h-16 opacity-40 hidden md:block" />
        <FilmReel className="absolute top-[10%] right-[30%] w-14 h-14 opacity-35 hidden lg:block" />
        <FilmReel className="absolute bottom-[5%] right-[45%] w-18 h-18 opacity-48 hidden md:block" />

        {/* Film strips */}
        <FilmStrip className="absolute left-6 top-8 w-7 opacity-80 hidden lg:block" />
        <FilmStrip className="absolute right-6 top-16 w-7 opacity-70 hidden lg:block" />
        <FilmStrip className="absolute left-[25%] bottom-4 w-6 opacity-55 rotate-[8deg] hidden lg:block" />
        <FilmStrip className="absolute right-[30%] top-4 w-5 opacity-48 -rotate-6 hidden lg:block" />
        <FilmStrip className="absolute left-[60%] top-[15%] w-5 opacity-42 rotate-[15deg] hidden lg:block" />
        <FilmStrip className="absolute right-[55%] bottom-[10%] w-6 opacity-48 -rotate-[10deg] hidden lg:block" />

        {/* Clapperboards */}
        <Clapperboard className="absolute top-[12%] left-[15%] w-24 opacity-62 -rotate-12 hidden sm:block" />
        <Clapperboard className="absolute bottom-[22%] right-[12%] w-20 opacity-55 rotate-6 hidden sm:block" />
        <Clapperboard className="absolute top-[65%] left-[55%] w-16 opacity-42 rotate-3 hidden md:block" />
        <Clapperboard className="absolute top-[40%] left-[8%] w-14 opacity-35 rotate-[20deg] hidden lg:block" />
        <Clapperboard className="absolute bottom-[8%] left-[35%] w-18 opacity-48 -rotate-6 hidden md:block" />
        <Clapperboard className="absolute top-[5%] right-[15%] w-12 opacity-34 rotate-12 hidden lg:block" />

        {/* Play buttons */}
        <PlayButton className="absolute top-[30%] right-[20%] w-12 opacity-62 hidden sm:block" />
        <PlayButton className="absolute bottom-[35%] left-[25%] w-10 opacity-48 hidden md:block" />
        <PlayButton className="absolute top-[75%] right-[35%] w-8 opacity-42 hidden md:block" />
        <PlayButton className="absolute top-[18%] left-[45%] w-9 opacity-34 hidden lg:block" />
        <PlayButton className="absolute bottom-[15%] right-[25%] w-11 opacity-48 hidden md:block" />
        <PlayButton className="absolute top-[50%] left-[18%] w-7 opacity-34 hidden lg:block" />
        <PlayButton className="absolute bottom-[40%] right-[8%] w-10 opacity-42 hidden md:block" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <span className="text-3xl font-semibold tracking-tight">
          Cin<span className="text-[var(--color-cindr)]">dr</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm px-4 py-2 rounded-full bg-[var(--color-cindr)] text-white hover:bg-[var(--color-cindr-hover)] transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-px bg-[var(--color-cindr)] opacity-60" />
            <div className="w-2 h-2 rounded-full bg-[var(--color-cindr)] opacity-50" />
            <div className="w-10 h-px bg-[var(--color-cindr)] opacity-60" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4">
            Find your perfect match.
            <br />
            <span className="text-[var(--color-cindr)] drop-shadow-[0_0_40px_rgba(216,90,48,0.4)]">
              Movie edition.
            </span>
          </h1>

          <p className="text-lg text-[var(--muted)] mb-10 max-w-md mx-auto leading-relaxed">
            Stop scrolling. Start swiping. One movie at a time, personalised to
            your taste.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--color-cindr)] text-white font-medium hover:bg-[var(--color-cindr-hover)] transition-all text-center shadow-[0_0_35px_rgba(216,90,48,0.3)] hover:shadow-[0_0_50px_rgba(216,90,48,0.5)]"
            >
              Start swiping
            </Link>
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[var(--border-color)] text-[var(--foreground)] font-medium hover:bg-[var(--surface)] hover:border-[var(--muted)] transition-all text-center"
            >
              Create account
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl w-full">
          <Feature
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
              </svg>
            }
            title="Swipe to discover"
            description="Movie cards served one at a time. Right for yes, left for nah."
          />
          <Feature
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            }
            title="Watch trailers"
            description="Swipe right and the trailer plays instantly. No hunting around."
          />
          <Feature
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            }
            title="Build your list"
            description="Save favourites, track what to watch. Your personal cinema queue."
          />
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center">
        <p className="text-[10px] text-[var(--muted)] opacity-60">
          This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
        </p>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-5 rounded-xl border border-[var(--border-color)] bg-[var(--surface)]/80 backdrop-blur-sm hover:border-[var(--color-cindr)]/30 transition-all">
      <div className="w-9 h-9 rounded-lg bg-[var(--color-cindr)]/10 flex items-center justify-center text-[var(--color-cindr)] mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
      <p className="text-xs text-[var(--muted)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
