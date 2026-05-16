"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { MovieCardData } from "@/types/movie";
import SwipeActions from "./SwipeActions";

const SWIPE_THRESHOLD = 100;

interface SwipeDeckProps {
  cards: MovieCardData[];
  onSwipe: (id: number, direction: "left" | "right") => void;
}

export default function SwipeDeck({ cards, onSwipe }: SwipeDeckProps) {
  const visibleCards = cards.slice(0, 3);

  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ height: 520 }}>
      {visibleCards.map((card, i) => (
        <SwipeCard
          key={card.id}
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
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const leftOpacity = useTransform(x, [-100, -20], [1, 0]);
  const rightOpacity = useTransform(x, [20, 100], [0, 1]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x;
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      setExiting(true);
      const direction = offset > 0 ? "right" : "left";
      setTimeout(() => onSwipe(card.id, direction), 200);
    }
  }

  const scale = 1 - index * 0.04;
  const yOffset = index * 8;

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale,
        y: yOffset,
        zIndex: 10 - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={
        exiting
          ? {
              x: x.get() > 0 ? 400 : -400,
              opacity: 0,
              transition: { duration: 0.2 },
            }
          : {}
      }
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--surface)] shadow-2xl select-none">
        {card.posterUrl ? (
          <img
            src={card.posterUrl}
            alt={card.title}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--surface)] flex items-center justify-center">
            <span className="text-4xl opacity-30">🎬</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {isTop && (
          <>
            <motion.div
              className="absolute top-6 left-6 px-4 py-2 rounded-xl border-2 border-red-500 text-red-500 font-bold text-lg -rotate-12"
              style={{ opacity: leftOpacity }}
            >
              NOPE
            </motion.div>
            <motion.div
              className="absolute top-6 right-6 px-4 py-2 rounded-xl border-2 border-green-500 text-green-500 font-bold text-lg rotate-12"
              style={{ opacity: rightOpacity }}
            >
              WATCH
            </motion.div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2">
            {card.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/15 text-white/80"
              >
                {g}
              </span>
            ))}
            <span className="text-[10px] text-white/50">
              {card.language}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight mb-1">
            {card.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
            <span>{card.year}</span>
            {card.rating > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-yellow-400">{card.rating}</span>
              </>
            )}
            {card.runtime && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{card.runtime} min</span>
              </>
            )}
          </div>
          <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
            {card.overview}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
