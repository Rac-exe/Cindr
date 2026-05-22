import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import { getMovieDetails, getTVDetails } from "@/lib/tmdb/client";
import type { Movie } from "@/types/movie";
import { backdropUrl, posterUrl } from "@/types/movie";

type SharePageProps = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

function isMediaType(type: string): type is "movie" | "tv" {
  return type === "movie" || type === "tv";
}

async function getSharedMovie(type: string, id: string): Promise<Movie | null> {
  if (!isMediaType(type)) return null;
  const tmdbId = Number(id);
  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) return null;

  try {
    const movie =
      type === "tv" ? await getTVDetails(tmdbId) : await getMovieDetails(tmdbId);
    return movie.adult ? null : movie;
  } catch {
    return null;
  }
}

function yearFrom(movie: Movie): string {
  return movie.release_date?.slice(0, 4) ?? "";
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { type, id } = await params;
  const movie = await getSharedMovie(type, id);

  if (!movie) {
    return {
      title: "Cindr",
      description: "Find your perfect match. Movie edition.",
    };
  }

  const image = posterUrl(movie.poster_path, "w780") ??
    backdropUrl(movie.backdrop_path, "w1280") ??
    undefined;
  const title = `${movie.title} on Cindr`;
  const description =
    movie.overview || "Swipe through personalised movie and series recommendations.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image
        ? [
            {
              url: image,
              width: 780,
              height: 1170,
              alt: movie.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function SharedMoviePage({ params }: SharePageProps) {
  const { type, id } = await params;
  const movie = await getSharedMovie(type, id);
  if (!movie || !isMediaType(type)) notFound();

  const poster = posterUrl(movie.poster_path, "w780");
  const backdrop = backdropUrl(movie.backdrop_path, "w1280");
  const year = yearFrom(movie);
  const tmdbRating = Math.round(movie.vote_average * 10) / 10;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <CinematicBackdrop density="balanced" />
      {backdrop && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.18] blur-sm"
          style={{ backgroundImage: `url(${backdrop})` }}
          aria-hidden="true"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-[var(--background)]/90 to-[var(--background)]" />
      <AppHeader />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-24">
        <section className="grid w-full max-w-5xl gap-8 rounded-[2rem] border border-white/10 bg-[#111015]/82 p-4 shadow-[0_28px_100px_rgba(0,0,0,0.6)] backdrop-blur-md md:grid-cols-[minmax(240px,360px)_1fr] md:p-6">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            {poster ? (
              <Image
                src={poster}
                alt={movie.title}
                width={780}
                height={1170}
                sizes="(min-width: 768px) 360px, calc(100vw - 2rem)"
                className="aspect-[2/3] h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center p-6 text-center text-sm text-[var(--muted)]">
                {movie.title}
              </div>
            )}
            <div className="absolute left-4 top-4 rounded-full border border-[var(--color-cindr)]/35 bg-black/[0.65] px-3 py-1 text-xs font-semibold text-[var(--color-cindr)] backdrop-blur-sm">
              Cindr pick
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span className="rounded-full bg-white/10 px-3 py-1">
                {type === "tv" ? "TV Series" : "Movie"}
              </span>
              {year && <span>{year}</span>}
              {tmdbRating > 0 && (
                <span className="text-yellow-400">TMDB {tmdbRating}/10</span>
              )}
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              {movie.title}
            </h1>

            {movie.genres && movie.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/75"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              {movie.overview || "No overview available yet."}
            </p>

            <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                  Cindr rating
                </p>
                <p className="mt-1 text-lg font-bold text-white">Coming soon</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                  Shared card
                </p>
                <p className="mt-1 text-sm text-white/75">
                  Open this title in Cindr and start discovering from here.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/discover"
                className="rounded-full bg-[var(--color-cindr)] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_0_20px_rgba(216,90,48,0.18)] transition-colors hover:bg-[var(--color-cindr-hover)]"
              >
                Discover on Cindr
              </Link>
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 text-center text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white"
              >
                What is Cindr?
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
