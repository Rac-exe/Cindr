"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, useMotionValueEvent, PanInfo } from "framer-motion";
import type { MovieCardData } from "@/types/movie";
import SwipeActions from "./SwipeActions";

const SWIPE_THRESHOLD = 120;
const MOTION_EASE_OUT = [0.22, 1, 0.36, 1] as const;
const MOTION_EASE_IN = [0.4, 0, 1, 1] as const;

interface SwipeDeckProps {
  cards: MovieCardData[];
  onSwipeStart?: (id: number, direction: "left" | "right") => void;
  onSwipe: (id: number, direction: "left" | "right") => void;
  swipeRequest?: { direction: "left" | "right"; nonce: number; cardId: number };
  onOpenTrailer?: () => void;
  trailerOpen?: boolean;
  discoverMode?: string;
  onUndo?: () => void;
  canUndo?: boolean;
}

export default function SwipeDeck({
  cards,
  onSwipeStart,
  onSwipe,
  swipeRequest,
  onOpenTrailer,
  trailerOpen,
  discoverMode,
  onUndo,
  canUndo,
}: SwipeDeckProps) {
  const visibleCards = cards.slice(0, 3);
  const [actionRequest, setActionRequest] = useState<{
    direction: "left" | "right";
    nonce: number;
    cardId: number;
  } | null>(null);
  const [dragDirection, setDragDirection] = useState<"left" | "right" | "up" | null>(null);
  const actionNonce = useRef(0);
  const activeRequest = swipeRequest ?? actionRequest ?? undefined;

  function requestSwipe(direction: "left" | "right") {
    const topCard = visibleCards[0];
    if (!topCard) return;
    const nonce = actionNonce.current + 1;
    actionNonce.current = nonce;
    setActionRequest({ direction, nonce, cardId: topCard.id });
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative mx-auto flex-1 min-h-0 w-[min(84vw,360px)] sm:w-[min(92vw,430px)] md:w-[min(92vw,440px)] md:max-h-[640px] mt-1">
        {visibleCards.map((card, i) => (
          <SwipeCard
            key={`${card.media_type ?? "movie"}-${card.id}`}
            card={card}
            index={i}
            onSwipeStart={onSwipeStart}
            onSwipe={onSwipe}
            isTop={i === 0}
            swipeRequest={i === 0 ? activeRequest : undefined}
            onDragChange={i === 0 ? setDragDirection : undefined}
            onOpenTrailer={i === 0 ? onOpenTrailer : undefined}
            trailerOpen={trailerOpen}
            showRecommendedChip={discoverMode === "taste"}
          />
        ))}
      </div>

      {visibleCards.length > 0 && (
        <div className="flex w-full flex-col items-center gap-2 pb-2 pt-5 sm:pt-6">
          <SwipeActions
            onSkip={() => requestSwipe("left")}
            onLike={() => requestSwipe("right")}
            onOpenTrailer={onOpenTrailer}
            dragDirection={dragDirection}
            trailerOpen={trailerOpen}
          />
          {canUndo && onUndo && (
            <div className="flex w-[min(84vw,360px)] justify-end sm:w-[min(92vw,430px)]">
              <button
                onClick={onUndo}
                className="h-7 rounded-full border border-white/10 bg-[#111015]/88 px-3 text-[11px] font-medium text-white/58 backdrop-blur-md transition-colors hover:bg-white/[0.06] hover:text-white active:scale-95"
              >
                Undo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SwipeCard({
  card,
  index,
  onSwipeStart,
  onSwipe,
  isTop,
  swipeRequest,
  onDragChange,
  onOpenTrailer,
  trailerOpen,
  showRecommendedChip,
}: {
  card: MovieCardData;
  index: number;
  onSwipeStart?: (id: number, direction: "left" | "right") => void;
  onSwipe: (id: number, direction: "left" | "right") => void;
  isTop: boolean;
  swipeRequest?: { direction: "left" | "right"; nonce: number; cardId: number };
  onDragChange?: (dir: "left" | "right" | "up" | null) => void;
  onOpenTrailer?: () => void;
  trailerOpen?: boolean;
  showRecommendedChip?: boolean;
})
 {
  const [exitingDirection, setExitingDirection] = useState<"left" | "right" | null>(null);
  const handledNonce = useRef<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const leftOpacity = useTransform(x, [-110, -32], [1, 0]);
  const rightOpacity = useTransform(x, [32, 110], [0, 1]);
  const upOpacity = useTransform(y, [-88, -28], [1, 0]);
  const borderOpacity = useTransform(x, [-180, 0, 180], [0.72, 0.38, 0.72]);
  const accentX = useTransform(x, [-180, 180], ["-12%", "12%"]);

  useMotionValueEvent(x, "change", (v) => {
    if (!isTop) return;
    const yv = y.get();
    if (yv < -18 && Math.abs(yv) > Math.abs(v)) return; // upward drag dominates
    if (v < -18) onDragChange?.("left");
    else if (v > 18) onDragChange?.("right");
    else onDragChange?.(null);
  });

  useMotionValueEvent(y, "change", (v) => {
    if (!isTop) return;
    const xv = x.get();
    if (v < -18 && Math.abs(v) > Math.abs(xv)) onDragChange?.("up");
    else if (v >= -18 && Math.abs(xv) <= 18) onDragChange?.(null);
  });

  function exitCard(direction: "left" | "right") {
    if (exitingDirection) return;
    onDragChange?.(null);
    setExitingDirection(direction);
    onSwipeStart?.(card.id, direction);
    setTimeout(() => onSwipe(card.id, direction), 160);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const ox = info.offset.x;
    const oy = info.offset.y;
    // Upward swipe: primarily vertical and going up
    if (oy < -80 && Math.abs(oy) > Math.abs(ox)) {
      onDragChange?.(null);
      onOpenTrailer?.();
      return;
    }
    // Horizontal swipe
    if (Math.abs(ox) > SWIPE_THRESHOLD) {
      const direction = ox > 0 ? "right" : "left";
      exitCard(direction);
    } else {
      onDragChange?.(null);
    }
  }

  useEffect(() => {
    if (!isTop || !swipeRequest) return;
    if (swipeRequest.cardId !== card.id) return;
    if (handledNonce.current === swipeRequest.nonce) return;
    handledNonce.current = swipeRequest.nonce;
    exitCard(swipeRequest.direction);
    // exitCard intentionally reads the current card instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop, swipeRequest]);

  const scale = 1 - index * 0.04;
  const yOffset = index * 10;

  const leftGlow = useTransform(x, [-160, -36], [0.22, 0]);
  const rightGlow = useTransform(x, [36, 160], [0, 0.22]);

  return (
    <>
      {isTop && (
        <>
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              opacity: leftGlow,
              background: "linear-gradient(to right, rgba(239,68,68,0.28) 0%, rgba(239,68,68,0.07) 35%, transparent 68%)",
            }}
          />
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              opacity: rightGlow,
              background: "linear-gradient(to left, rgba(216,90,48,0.28) 0%, rgba(216,90,48,0.07) 35%, transparent 68%)",
            }}
          />
        </>
      )}
    <motion.div
      className={`absolute inset-0 touch-none ${isTop ? "will-change-transform" : ""}`}
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - index,
      }}
      drag={isTop && !trailerOpen}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.46}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={
        isTop
          ? { opacity: 0, scale: 0.98, y: 14 }
          : { opacity: 0, scale: 0.96, y: 10 }
      }
      animate={
        exitingDirection
          ? {
              x: exitingDirection === "right" ? 520 : -520,
              rotate: exitingDirection === "right" ? 12 : -12,
              opacity: 0,
              scale: 0.98,
              transition: { duration: 0.22, ease: MOTION_EASE_IN },
            }
          : {
              opacity: 1,
              scale,
              y: yOffset,
              transition: { duration: 0.26, ease: MOTION_EASE_OUT },
            }
      }
    >
      <div
        className="group relative h-full w-full select-none overflow-hidden rounded-[1.75rem] bg-[#0f0f14] p-[1px]"
        style={{
          boxShadow: card.isSuperMatch
            ? "0 0 0 1px rgba(245,158,11,0.45), 0 24px 80px rgba(0,0,0,0.52)"
            : "0 24px 80px rgba(0,0,0,0.52)",
        }}
      >
        {card.isSuperMatch ? (
          <motion.div
            className="absolute inset-0 rounded-[2rem]"
            style={{ x: isTop ? accentX : 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.2 }}
            initial={false}
          >
            <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(130deg,rgba(251,191,36,0.35),rgba(245,158,11,0.98),rgba(255,255,255,0.22),rgba(217,119,6,0.62),rgba(251,191,36,0.35))]" />
          </motion.div>
        ) : (
          <motion.div
            className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(120deg,rgba(216,90,48,0.08),rgba(216,90,48,0.42),rgba(255,255,255,0.1),rgba(153,60,29,0.22),rgba(216,90,48,0.08))]"
            style={{ opacity: isTop ? borderOpacity : 0.22, x: isTop ? accentX : 0 }}
          />
        )}
        <div className="relative h-full w-full overflow-hidden rounded-[calc(2rem-1px)] bg-[var(--surface)]">
          {card.posterUrl ? (
            <>
              <Image
                src={card.posterUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 84vw, 430px"
                priority={index === 0}
                loading="eager"
                className="scale-110 object-cover opacity-45 blur-xl"
                draggable={false}
                aria-hidden="true"
              />
              <Image
                src={card.posterUrl}
                alt={card.title}
                fill
                sizes="(max-width: 640px) 84vw, 430px"
                priority={index === 0}
                loading="eager"
                className="object-contain object-center transition-transform duration-300 ease-out group-hover:scale-[1.008]"
                draggable={false}
              />
            </>
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
                className="absolute left-6 top-6 rounded-full border border-red-300/70 bg-black/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-red-200 backdrop-blur-md"
                style={{ opacity: leftOpacity }}
              >
                Pass
              </motion.div>
              <motion.div
                className="absolute right-6 top-6 rounded-full border border-[var(--color-cindr)]/70 bg-black/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-cindr)] backdrop-blur-md"
                style={{ opacity: rightOpacity }}
              >
                Save
              </motion.div>
              <motion.div
                className="absolute bottom-36 left-1/2 -translate-x-1/2 rounded-full border border-white/35 bg-black/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/86 backdrop-blur-md"
                style={{ opacity: upOpacity }}
              >
                Trailer
              </motion.div>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            {card.isSuperMatch && (
              <div className="mb-2 flex items-center min-w-0">
                <span
                  className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-full border border-amber-300/30 bg-amber-300/16 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100"
                >
                  <svg className="shrink-0" width="9" height="9" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
                    <path d="M4 0L5 3H8L5.5 4.8L6.5 8L4 6.2L1.5 8L2.5 4.8L0 3H3L4 0Z"/>
                  </svg>
                  <span className="truncate">CindrMatch</span>
                </span>
              </div>
            )}
            {!card.isSuperMatch && card.isDiscovery && (
              <div className="mb-2 flex items-center min-w-0">
                <span className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
                  <svg className="shrink-0" width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="4" cy="4" r="3"/>
                    <path d="M4 2v2l1 1"/>
                  </svg>
                  <span className="truncate">Discovery pick</span>
                </span>
              </div>
            )}
            {!card.isSuperMatch && !card.isDiscovery && card.becauseOf && showRecommendedChip && (
              <div className="mb-2 flex items-center min-w-0">
                <span className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-full border border-[var(--color-cindr)]/35 bg-[var(--color-cindr)]/16 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/86">
                  <svg className="shrink-0" width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                    <path d="M4 0L5 3H8L5.5 4.8L6.5 8L4 6.2L1.5 8L2.5 4.8L0 3H3L4 0Z"/>
                  </svg>
                  <span className="truncate">Recommended for you</span>
                </span>
              </div>
            )}
            <div className="mb-2.5 h-px w-12 rounded-full bg-[var(--color-cindr)]/70" />
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {card.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="whitespace-nowrap text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/85 ring-1 ring-white/10"
                >
                  {g}
                </span>
              ))}
              <span className="text-[10px] font-medium text-white/55">
                {card.language}
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.035em] text-white leading-tight mb-1.5 line-clamp-2 sm:text-2xl">
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
    </>
  );
}
