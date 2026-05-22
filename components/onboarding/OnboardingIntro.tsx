"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Image from "next/image";
import { posterUrl } from "@/types/movie";

const CARDS = [
  {
    poster: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    title: "Inception",
    genres: ["Sci-Fi", "Thriller"],
    year: "2010",
    rating: "8.8",
  },
  {
    poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    title: "The Dark Knight",
    genres: ["Action", "Crime"],
    year: "2008",
    rating: "9.0",
  },
  {
    poster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    title: "Interstellar",
    genres: ["Sci-Fi", "Drama"],
    year: "2014",
    rating: "8.7",
  },
];

// Phase durations in ms (for the story progress bars)
const PHASE_DURATIONS = [3600, 2200, 2000, 2400];

type Phase = 0 | 1 | 2 | 3 | 4;

// Story progress bar for one segment
function StoryBar({
  active,
  done,
  duration,
}: {
  active: boolean;
  done: boolean;
  duration: number;
}) {
  return (
    <div className="h-[3px] flex-1 rounded-full bg-white/15 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-white/80"
        initial={{ width: done ? "100%" : "0%" }}
        animate={{ width: active ? "100%" : done ? "100%" : "0%" }}
        transition={
          active ? { duration: duration / 1000, ease: "linear" } : { duration: 0 }
        }
      />
    </div>
  );
}

export default function OnboardingIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [exitLabel, setExitLabel] = useState<"reel" | "skip" | null>(null);
  const [glowDir, setGlowDir] = useState<"left" | "right" | null>(null);
  const cardControls = useAnimation();
  const cancelled = useRef(false);

  const card = CARDS[cardIdx];

  useEffect(() => {
    cancelled.current = false;

    const run = async () => {
      // Text appears first — card slides in after a beat
      await sleep(900);
      if (cancelled.current) return;

      await cardControls.start({
        y: 0,
        opacity: 1,
        x: 0,
        rotate: 0,
        scale: 1,
        transition: { type: "spring", damping: 22, stiffness: 230 },
      });

      if (cancelled.current) return;
      await sleep(1800); // hold brand phase after card settles
      if (cancelled.current) return;

      // ── Phase 1: Right swipe ──────────────────────────────────
      setPhase(1);
      await sleep(400); // let text settle
      setExitLabel("reel");
      setGlowDir("right");
      await cardControls.start({
        x: 560,
        rotate: 22,
        opacity: 0,
        transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
      });
      if (cancelled.current) return;
      setGlowDir(null);
      setExitLabel(null);
      setCardIdx(1);
      await cardControls.set({ y: 80, x: 0, rotate: 0, opacity: 0, scale: 1 });
      await cardControls.start({
        y: 0,
        opacity: 1,
        transition: { type: "spring", damping: 22, stiffness: 240 },
      });
      if (cancelled.current) return;
      await sleep(1100);
      if (cancelled.current) return;

      // ── Phase 2: Left swipe ───────────────────────────────────
      setPhase(2);
      await sleep(400);
      setExitLabel("skip");
      setGlowDir("left");
      await cardControls.start({
        x: -560,
        rotate: -22,
        opacity: 0,
        transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
      });
      if (cancelled.current) return;
      setGlowDir(null);
      setExitLabel(null);
      setCardIdx(2);
      await cardControls.set({ y: 80, x: 0, rotate: 0, opacity: 0, scale: 1 });
      await cardControls.start({
        y: 0,
        opacity: 1,
        transition: { type: "spring", damping: 22, stiffness: 240 },
      });
      if (cancelled.current) return;
      await sleep(1000);
      if (cancelled.current) return;

      // ── Phase 3: Hook ─────────────────────────────────────────
      setPhase(3);
      await cardControls.start({
        scale: 1.06,
        transition: { duration: 0.9, ease: "easeOut" },
      });
      if (cancelled.current) return;
      await sleep(1500);
      if (cancelled.current) return;

      // ── Phase 4: CTA ──────────────────────────────────────────
      setPhase(4);
    };

    run();
    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] overflow-hidden">
      {/* Subtle radial glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(216,90,48,0.08)_0%,transparent_70%)]" />
      </div>

      {/* Screen-edge swipe glows */}
      <AnimatePresence>
        {glowDir === "right" && (
          <motion.div
            key="glow-right"
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ background: "linear-gradient(to left, rgba(216,90,48,0.55) 0%, rgba(216,90,48,0.12) 35%, transparent 65%)" }}
          />
        )}
        {glowDir === "left" && (
          <motion.div
            key="glow-left"
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ background: "linear-gradient(to right, rgba(239,68,68,0.55) 0%, rgba(239,68,68,0.12) 35%, transparent 65%)" }}
          />
        )}
      </AnimatePresence>

      {/* Story progress bars */}
      <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-10">
        {PHASE_DURATIONS.map((dur, i) => (
          <StoryBar
            key={i}
            active={phase === i}
            done={phase > i}
            duration={dur}
          />
        ))}
      </div>

      {/* Skip button — bottom right */}
      <button
        onClick={onDone}
        className="absolute bottom-7 right-6 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-medium text-white/45 hover:text-white/75 hover:bg-white/[0.08] transition-colors"
      >
        Skip
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 px-6 w-full max-w-lg">

        {/* Text section */}
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-4">
                Cindr.
              </h1>
              <p className="text-lg sm:text-xl text-white/55 leading-relaxed">
                Instead of swiping for dates,
                <br />
                <span className="text-white font-semibold">
                  you swipe for movies.
                </span>
              </p>
            </motion.div>
          )}

          {phase === 1 && (
            <motion.div
              key="right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <span className="text-[var(--color-cindr)] text-2xl font-black">→</span>
                <span className="text-2xl font-bold text-white">Add to your reel.</span>
              </div>
              <p className="text-base text-white/40">Swipe right on anything you want to watch.</p>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div
              key="left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <span className="text-red-400 text-2xl font-black">←</span>
                <span className="text-2xl font-bold text-white">On to the next.</span>
              </div>
              <p className="text-base text-white/40">Don&apos;t feel it? Keep going.</p>
            </motion.div>
          )}

          {phase === 3 && (
            <motion.div
              key="hook"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                The more you swipe,
                <br />
                <span className="text-[var(--color-cindr)]">the sharper it gets.</span>
              </p>
            </motion.div>
          )}

          {phase === 4 && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="text-center flex flex-col items-center gap-6"
            >
              <p className="text-3xl font-black text-white tracking-tight">
                Ready to find your reel?
              </p>
              <button
                onClick={onDone}
                className="rounded-full bg-[var(--color-cindr)] px-10 py-4 text-lg font-semibold text-white shadow-[0_0_40px_rgba(216,90,48,0.5)] hover:bg-[var(--color-cindr-hover)] transition-all hover:scale-105 active:scale-[0.97]"
              >
                Set your taste →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Movie card */}
        {phase < 4 && (
          <div className="relative">
            <motion.div
              animate={cardControls}
              initial={{ y: 80, opacity: 0, x: 0, rotate: 0, scale: 1 }}
              className="relative w-72 h-[432px] sm:w-80 sm:h-[480px] rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
            >
              {/* Poster */}
              <Image
                src={posterUrl(card.poster) ?? ""}
                alt={card.title}
                fill
                sizes="208px"
                className="object-cover"
                priority
              />
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/25 to-transparent" />
              {/* Border */}
              <div className="absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-white/12" />

              {/* Exit labels */}
              <AnimatePresence>
                {exitLabel === "reel" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 left-4 rounded-xl border-2 border-[var(--color-cindr)] bg-black/40 px-3 py-1 text-xs font-black text-[var(--color-cindr)] -rotate-12 backdrop-blur-sm"
                  >
                    REEL
                  </motion.div>
                )}
                {exitLabel === "skip" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 right-4 rounded-xl border-2 border-red-400 bg-black/40 px-3 py-1 text-xs font-black text-red-300 rotate-12 backdrop-blur-sm"
                  >
                    SKIP
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card info */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex gap-2 mb-2">
                  {card.genres.map((g) => (
                    <span
                      key={g}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/85 ring-1 ring-white/10"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {card.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-white/55">
                  <span>{card.year}</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="text-yellow-400">{card.rating}</span>
                </div>
              </div>
            </motion.div>

            {/* Action buttons — pulse on phases 1 & 2 */}
            <AnimatePresence>
              {(phase === 1 || phase === 2) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute -bottom-14 left-0 right-0 flex items-center justify-center gap-5"
                >
                  {/* X button */}
                  <motion.div
                    animate={
                      phase === 2
                        ? { scale: [1, 1.18, 1], boxShadow: ["0 0 0px rgba(248,113,113,0)", "0 0 24px rgba(248,113,113,0.6)", "0 0 0px rgba(248,113,113,0)"] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="grid h-12 w-12 place-items-center rounded-full border border-red-400/45 bg-[#14141b]/90 text-red-300"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </motion.div>

                  {/* Cinema button */}
                  <motion.div
                    animate={
                      phase === 1
                        ? { scale: [1, 1.18, 1], boxShadow: ["0 0 0px rgba(216,90,48,0)", "0 0 28px rgba(216,90,48,0.65)", "0 0 0px rgba(216,90,48,0)"] }
                        : { scale: 1 }
                    }
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
