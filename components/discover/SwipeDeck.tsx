"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { MovieCardData } from "@/types/movie";
import SwipeActions from "./SwipeActions";

const SWIPE_THRESHOLD = 120;

interface SwipeDeckProps {
  cards: MovieCardData[];
  onSwipe: (id: number, direction: "left" | "right") => void;
}

export default function SwipeDeck({ cards, onSwipe }: SwipeDeckProps) {
  const visibleCards = cards.slice(0, 3);

  return (
    <div className="relative mx-auto h-[min(74dvh,680px)] w-[min(92vw,440px)]">
      {visibleCards.map((card, i) => (
        <SwipeCard
          key={`${card.media_type ?? "movie"}-${card.id}`}
          card={card}
          index={i}
          onSwipe={onSwipe}
          isTop={i === 0}
        />
      ))}
      {visibleCards.length > 0 && (
        <SwipeActions
          onSkip={() => onSwipe(visibleCards[0].id, "left")}
          onLike={() => onSwipe(visibleCards[0].id, "right")}
        />
      )}
    </div>
  );
}

function SwipeCard({
  card,
  index,
  onSwipe,
  isTop,
}: {
  card: MovieCardData;
  index: number;
  onSwipe: (id: number, direction: "left" | "right") => void;
  isTop: boolean;
}) {
  const [exiting, setExiting] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const leftOpacity = useTransform(x, [-100, -20], [1, 0]);
  const rightOpacity = useTransform(x, [20, 100], [0, 1]);
  const borderOpacity = useTransform(x, [-180, 0, 180], [0.9, 0.45, 0.9]);
  const accentX = useTransform(x, [-180, 180], ["-22%", "22%"]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x;
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      setExiting(true);
      const direction = offset > 0 ? "right" : "left";
      setTimeout(() => onSwipe(card.id, direction), 200);
    }
  }

  const scale = 1 - index * 0.04;
  const yOffset = index * 10;

  return (
    <motion.div
      className={`absolute inset-0 touch-none ${isTop ? "will-change-transform" : ""}`}
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={
        isTop
          ? { opacity: 0, scale: 0.94, y: 24 }
          : { opacity: 0, scale: 0.9, y: 18 }
      }
      animate={
        exiting
          ? {
              x: x.get() > 0 ? 520 : -520,
              rotate: x.get() > 0 ? 18 : -18,
              opacity: 0,
              scale: 0.96,
              transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
            }
          : {
              opacity: 1,
              scale,
              y: yOffset,
              transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] },
            }
      }
    >
      <div className="group relative h-full w-full select-none overflow-hidden rounded-[2rem] bg-[#0f0f14] p-[1px] shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
        <motion.div
          className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(120deg,rgba(216,90,48,0.18),rgba(216,90,48,0.95),rgba(255,255,255,0.16),rgba(153,60,29,0.5),rgba(216,90,48,0.18))]"
          style={{ opacity: isTop ? borderOpacity : 0.28, x: isTop ? accentX : 0 }}
        />
        <div className="relative h-full w-full overflow-hidden rounded-[calc(2rem-1px)] bg-[var(--surface)]">
          {card.posterUrl ? (
            <img
              src={card.posterUrl}
              alt={card.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
              draggable={false}
              decoding="async"
              loading={index === 0 ? "eager" : "lazy"}
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--surface)] flex items-center justify-center">
              <svg className="h-16 w-16 text-[var(--color-cindr)] opacity-45" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="26" stroke="currentColor" strokeWidth="3" />
                <path d="M24 18l18 12-18 12V18z" fill="currentColor" />
              </svg>
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.72)_28%,rgba(0,0,0,0.08)_66%,rgba(0,0,0,0.25)_100%)]" />
          <div className="absolute inset-0 rounded-[calc(2rem-1px)] ring-1 ring-inset ring-white/10" />

          {isTop && (
            <>
              <motion.div
                className="absolute left-6 top-6 rounded-2xl border-2 border-red-400 bg-black/35 px-4 py-2 text-lg font-black text-red-300 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md -rotate-12"
                style={{ opacity: leftOpacity }}
              >
                SKIP
              </motion.div>
              <motion.div
                className="absolute right-6 top-6 rounded-2xl border-2 border-[var(--color-cindr)] bg-black/35 px-4 py-2 text-lg font-black text-[var(--color-cindr)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md rotate-12"
                style={{ opacity: rightOpacity }}
              >
                WATCH
              </motion.div>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <div className="mb-3 h-1 w-12 rounded-full bg-[var(--color-cindr)] shadow-[0_0_18px_rgba(216,90,48,0.5)]" />
            <div className="flex items-center gap-2 mb-3">
              {card.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/85 ring-1 ring-white/10"
                >
                  {g}
                </span>
              ))}
              <span className="text-[10px] font-medium text-white/55">
                {card.language}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.05em] text-white leading-[0.95] mb-2">
              {card.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-white/65 mb-3">
              <span>{card.year}</span>
              {card.rating > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/35" />
                  <span className="text-yellow-300">{card.rating}</span>
                </>
              )}
              {card.runtime && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/35" />
                  <span>{card.runtime} min</span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm text-white/58 leading-relaxed line-clamp-2">
              {card.overview}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
