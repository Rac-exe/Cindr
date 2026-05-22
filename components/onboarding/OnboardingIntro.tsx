"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Image from "next/image";
import { posterUrl } from "@/types/movie";

const CARDS = [
  { poster: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", title: "Inception",      genres: ["Sci-Fi", "Thriller"], year: "2010", rating: "8.8" },
  { poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", title: "The Dark Knight", genres: ["Action", "Crime"],   year: "2008", rating: "9.0" },
  { poster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", title: "Interstellar",   genres: ["Sci-Fi", "Drama"],   year: "2014", rating: "8.7" },
  { poster: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", title: "Dune",           genres: ["Sci-Fi", "Epic"],    year: "2021", rating: "8.0" },
];

// 5 story bars for phases 0–4; phase 5 is CTA
const PHASE_DURATIONS = [3200, 2000, 2000, 3200, 2000];
type Phase = 0 | 1 | 2 | 3 | 4 | 5;

function StoryBar({ active, done, duration }: { active: boolean; done: boolean; duration: number }) {
  return (
    <div className="h-[3px] flex-1 rounded-full bg-white/15 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-white/80"
        initial={{ width: done ? "100%" : "0%" }}
        animate={{ width: active ? "100%" : done ? "100%" : "0%" }}
        transition={active ? { duration: duration / 1000, ease: "linear" } : { duration: 0 }}
      />
    </div>
  );
}

export default function OnboardingIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [exitLabel, setExitLabel] = useState<"like" | "skip" | "trailer" | null>(null);
  const [glowDir, setGlowDir] = useState<"left" | "right" | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const cardControls = useAnimation();
  const cancelled = useRef(false);
  const card = CARDS[cardIdx];

  useEffect(() => {
    cancelled.current = false;

    const run = async () => {
      // ── Phase 0: Brand ────────────────────────────────────────
      await sleep(900);
      if (cancelled.current) return;
      await cardControls.start({
        y: 0, opacity: 1, x: 0, rotate: 0, scale: 1,
        transition: { type: "spring", damping: 22, stiffness: 230 },
      });
      if (cancelled.current) return;
      await sleep(1700);
      if (cancelled.current) return;

      // ── Phase 1: Right swipe → Like ───────────────────────────
      setPhase(1);
      await sleep(400);
      setExitLabel("like");
      setGlowDir("right");
      await cardControls.start({
        x: 560, rotate: 22, opacity: 0,
        transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
      });
      if (cancelled.current) return;
      setGlowDir(null); setExitLabel(null);
      setCardIdx(1);
      await cardControls.set({ y: 80, x: 0, rotate: 0, opacity: 0, scale: 1 });
      await cardControls.start({ y: 0, opacity: 1, transition: { type: "spring", damping: 22, stiffness: 240 } });
      if (cancelled.current) return;
      await sleep(900);
      if (cancelled.current) return;

      // ── Phase 2: Left swipe → Skip ────────────────────────────
      setPhase(2);
      await sleep(400);
      setExitLabel("skip");
      setGlowDir("left");
      await cardControls.start({
        x: -560, rotate: -22, opacity: 0,
        transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
      });
      if (cancelled.current) return;
      setGlowDir(null); setExitLabel(null);
      setCardIdx(2);
      await cardControls.set({ y: 80, x: 0, rotate: 0, opacity: 0, scale: 1 });
      await cardControls.start({ y: 0, opacity: 1, transition: { type: "spring", damping: 22, stiffness: 240 } });
      if (cancelled.current) return;
      await sleep(800);
      if (cancelled.current) return;

      // ── Phase 3: Swipe up → Trailer ───────────────────────────
      setPhase(3);
      await sleep(500);
      // Card slides up like a swipe-up gesture
      setExitLabel("trailer");
      await cardControls.start({
        y: -320, opacity: 0,
        transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
      });
      if (cancelled.current) return;
      setExitLabel(null);
      // Trailer mock slides in
      setTrailerOpen(true);
      await sleep(2000);
      if (cancelled.current) return;
      setTrailerOpen(false);
      await sleep(400);
      // Card comes back down
      setCardIdx(3);
      await cardControls.set({ y: 80, x: 0, rotate: 0, opacity: 0, scale: 1 });
      await cardControls.start({ y: 0, opacity: 1, transition: { type: "spring", damping: 22, stiffness: 240 } });
      if (cancelled.current) return;
      await sleep(300);

      // ── Phase 4: Hook ─────────────────────────────────────────
      setPhase(4);
      await cardControls.start({ scale: 1.05, transition: { duration: 0.9, ease: "easeOut" } });
      if (cancelled.current) return;
      await sleep(1400);
      if (cancelled.current) return;

      // ── Phase 5: CTA ──────────────────────────────────────────
      setPhase(5);
    };

    run();
    return () => { cancelled.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] overflow-hidden">
      {/* Radial ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(216,90,48,0.08)_0%,transparent_70%)]" />
      </div>

      {/* Edge glows */}
      <AnimatePresence>
        {glowDir === "right" && (
          <motion.div key="glow-right" className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ background: "linear-gradient(to left, rgba(216,90,48,0.55) 0%, rgba(216,90,48,0.12) 35%, transparent 65%)" }}
          />
        )}
        {glowDir === "left" && (
          <motion.div key="glow-left" className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ background: "linear-gradient(to right, rgba(239,68,68,0.55) 0%, rgba(239,68,68,0.12) 35%, transparent 65%)" }}
          />
        )}
      </AnimatePresence>

      {/* Story bars */}
      <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-10">
        {PHASE_DURATIONS.map((dur, i) => (
          <StoryBar key={i} active={phase === i} done={phase > i} duration={dur} />
        ))}
      </div>

      {/* Skip button */}
      <button onClick={onDone} className="absolute bottom-[calc(1.75rem+env(safe-area-inset-bottom))] right-6 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-medium text-white/45 hover:text-white/75 hover:bg-white/[0.08] transition-colors">
        Skip
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </button>

      {/* Content */}
      <div className="flex flex-col items-center gap-8 px-6 w-full max-w-lg">

        {/* Phase text */}
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.div key="brand" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5 }} className="text-center">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-4">Cindr.</h1>
              <p className="text-lg sm:text-xl text-white/55 leading-relaxed">
                Instead of swiping for dates,<br />
                <span className="text-white font-semibold">you swipe for movies.</span>
              </p>
            </motion.div>
          )}
          {phase === 1 && (
            <motion.div key="right" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }} className="text-center">
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <span className="text-[var(--color-cindr)] text-2xl font-black">→</span>
                <span className="text-2xl font-bold text-white">Like it.</span>
              </div>
              <p className="text-base text-white/40">Swipe right to add to your reel.</p>
            </motion.div>
          )}
          {phase === 2 && (
            <motion.div key="left" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }} className="text-center">
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <span className="text-red-400 text-2xl font-black">←</span>
                <span className="text-2xl font-bold text-white">Not feeling it?</span>
              </div>
              <p className="text-base text-white/40">Swipe left to skip.</p>
            </motion.div>
          )}
          {phase === 3 && (
            <motion.div key="trailer-text" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }} className="text-center">
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <span className="text-white/70 text-2xl font-black">↑</span>
                <span className="text-2xl font-bold text-white">Watch the trailer.</span>
              </div>
              <p className="text-base text-white/40">Swipe up or tap Trailer before you decide.</p>
            </motion.div>
          )}
          {phase === 4 && (
            <motion.div key="hook" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                The more you swipe,<br />
                <span className="text-[var(--color-cindr)]">the sharper it gets.</span>
              </p>
            </motion.div>
          )}
          {phase === 5 && (
            <motion.div key="cta" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: "easeOut" }} className="text-center flex flex-col items-center gap-6">
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">Ready to find your reel?</p>
              <button onClick={onDone} className="rounded-full bg-[var(--color-cindr)] px-10 py-4 text-lg font-semibold text-white shadow-[0_0_40px_rgba(216,90,48,0.5)] hover:bg-[var(--color-cindr-hover)] transition-all hover:scale-105 active:scale-[0.97]">
                Set your taste →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card area */}
        {phase < 5 && (
          <div className="relative">
            {/* Movie card */}
            <motion.div
              animate={cardControls}
              initial={{ y: 80, opacity: 0, x: 0, rotate: 0, scale: 1 }}
              className="relative w-[min(18rem,82vw)] h-[min(432px,72dvh)] sm:w-80 sm:h-[480px] rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
            >
              <Image src={posterUrl(card.poster) ?? ""} alt={card.title} fill sizes="320px" className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/25 to-transparent" />
              <div className="absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-white/12" />

              {/* Stamps */}
              <AnimatePresence>
                {exitLabel === "like" && (
                  <motion.div key="like" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 right-4 rounded-xl border-2 border-[var(--color-cindr)] bg-black/40 px-3 py-1 text-xs font-black text-[var(--color-cindr)] rotate-12 backdrop-blur-sm"
                  >LIKE</motion.div>
                )}
                {exitLabel === "skip" && (
                  <motion.div key="skip" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 left-4 rounded-xl border-2 border-red-400 bg-black/40 px-3 py-1 text-xs font-black text-red-300 -rotate-12 backdrop-blur-sm"
                  >SKIP</motion.div>
                )}
                {exitLabel === "trailer" && (
                  <motion.div key="trailer-stamp" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-28 left-1/2 -translate-x-1/2 rounded-xl border-2 border-white/60 bg-black/40 px-4 py-1.5 text-sm font-black text-white backdrop-blur-sm whitespace-nowrap"
                  >TRAILER ↑</motion.div>
                )}
              </AnimatePresence>

              {/* Card info */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex gap-2 mb-2">
                  {card.genres.map((g) => (
                    <span key={g} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/85 ring-1 ring-white/10">{g}</span>
                  ))}
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">{card.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-white/55">
                  <span>{card.year}</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="text-yellow-400">{card.rating}</span>
                </div>
              </div>
            </motion.div>

            {/* Trailer mock — slides up from bottom over the card */}
            <AnimatePresence>
              {trailerOpen && (
                <motion.div
                  key="trailer-mock"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 280 }}
                  className="absolute inset-0 rounded-[2rem] overflow-hidden bg-[#0d0d12]/95 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center gap-4 shadow-[0_0_60px_rgba(0,0,0,0.8)]"
                >
                  {/* Fake player */}
                  <div className="w-full px-6">
                    <div className="w-full aspect-video rounded-xl bg-black/70 border border-white/10 flex items-center justify-center relative overflow-hidden">
                      {/* Blurred poster as bg */}
                      <Image src={posterUrl(CARDS[2].poster) ?? ""} alt="" fill sizes="280px" className="object-cover opacity-30 blur-sm scale-105" />
                      {/* Play button */}
                      <div className="relative z-10 grid h-14 w-14 place-items-center rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                        <svg width="20" height="20" viewBox="0 0 9 10" fill="white" className="translate-x-[2px]">
                          <path d="M8.5 5L0.5 0.669873V9.33013L8.5 5Z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 w-full">
                    <p className="text-sm font-bold text-white mb-0.5">{CARDS[2].title}</p>
                    <p className="text-xs text-white/40">Official Trailer · {CARDS[2].year}</p>
                  </div>
                  {/* Trailer pill glow */}
                  <div
                    className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-cindr)]/20 px-4"
                    style={{ boxShadow: "0 0 0 1.5px rgba(216,90,48,0.8) inset, 0 0 28px rgba(216,90,48,0.45)" }}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-cindr)]/30">
                      <svg width="7" height="8" viewBox="0 0 9 10" fill="currentColor" className="translate-x-[1px] text-[var(--color-cindr)]">
                        <path d="M8.5 5L0.5 0.669873V9.33013L8.5 5Z" />
                      </svg>
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide text-[var(--color-cindr)]">Trailer</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <AnimatePresence>
              {(phase === 1 || phase === 2 || phase === 3) && !trailerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                  className="absolute -bottom-14 left-0 right-0 flex items-center justify-center gap-3 sm:gap-4"
                >
                  {/* Skip */}
                  <motion.div
                    animate={phase === 2 ? { scale: [1, 1.18, 1], boxShadow: ["0 0 0px rgba(248,113,113,0)", "0 0 24px rgba(248,113,113,0.6)", "0 0 0px rgba(248,113,113,0)"] } : { scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="grid h-12 w-12 place-items-center rounded-full border border-red-400/45 bg-[#14141b]/90 text-red-300"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </motion.div>

                  {/* Trailer pill */}
                  <motion.div
                    animate={phase === 3 ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 0 0 1px rgba(216,90,48,0.35) inset, 0 0 12px rgba(216,90,48,0.15)",
                        "0 0 0 1.5px rgba(216,90,48,0.9) inset, 0 0 32px rgba(216,90,48,0.55)",
                        "0 0 0 1px rgba(216,90,48,0.35) inset, 0 0 12px rgba(216,90,48,0.15)",
                      ],
                    } : { scale: 1, boxShadow: "0 0 0 1px rgba(216,90,48,0.35) inset, 0 0 12px rgba(216,90,48,0.15)" }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-cindr)]/10 px-4"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-cindr)]/20">
                      <svg width="7" height="8" viewBox="0 0 9 10" fill="currentColor" className="translate-x-[1px] text-[var(--color-cindr)]"><path d="M8.5 5L0.5 0.669873V9.33013L8.5 5Z" /></svg>
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide text-[var(--color-cindr)]">Trailer</span>
                  </motion.div>

                  {/* Like */}
                  <motion.div
                    animate={phase === 1 ? { scale: [1, 1.18, 1], boxShadow: ["0 0 0px rgba(216,90,48,0)", "0 0 28px rgba(216,90,48,0.65)", "0 0 0px rgba(216,90,48,0)"] } : { scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="grid h-14 w-14 place-items-center rounded-full border border-[var(--color-cindr)]/60 bg-[var(--color-cindr)] text-white"
                  >
                    <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                      <path d="M6 13.5h20v11.25A2.25 2.25 0 0 1 23.75 27H8.25A2.25 2.25 0 0 1 6 24.75V13.5Z" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
                      <path d="M6.75 9.25 25.6 5.5l.65 3.25L7.4 12.5 6.75 9.25Z" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
                      <path d="M10.25 8.55 13.2 12M15.55 7.5l2.95 3.45M20.85 6.45l2.95 3.45M11 18h5.25M11 22h9.75" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
