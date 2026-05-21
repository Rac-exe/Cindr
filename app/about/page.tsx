import {
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import AppHeader from "@/components/layout/AppHeader";

const HOW_TO_USE = ["Set your taste", "Swipe picks", "Watch trailers", "Save what hits"];

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/MrRaccooon", icon: GithubLogo },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/prabhat-bajpai", icon: LinkedinLogo },
  { label: "X", href: "https://x.com/PrabhatAstrix", icon: XLogo },
  { label: "Instagram", href: "https://instagram.com/prabhat.whynot", icon: InstagramLogo },
];

export default function AboutCindrPage() {
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <CinematicBackdrop density="balanced" />
      <AppHeader />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-16 pt-24 md:px-8 md:pt-28">
        <section className="mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-cindr)]">
            About Cindr
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">
            Find the movie faster.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/58 sm:text-base">
           Instead of swiping for dates, you swipe for movies.
          </p>
          <blockquote className="mx-auto mt-7 max-w-lg rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold italic text-white/78 backdrop-blur-md">
            &quot;The best movie should not be buried under 40 dead choices.&quot;
          </blockquote>
        </section>

        <section className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-md sm:p-7">
          <SectionHeading eyebrow="How to use it" title="Four taps. Thats it." />
          <div className="mt-6 grid gap-2 sm:grid-cols-4">
            {HOW_TO_USE.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center"
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-cindr)]">
                  0{index + 1}
                </p>
                <p className="mt-1 text-sm font-medium text-white/82">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#111015]/70 p-6 text-center backdrop-blur-md sm:p-7">
          <SectionHeading eyebrow="Built by Prabhat" title="Made for people who hate choosing forever." centered />
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/58">
            A cleaner way to discover movies without drowning in tabs, lists,
            and half-watched trailers.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/72 transition-colors hover:border-[var(--color-cindr)]/40 hover:bg-white/[0.08] hover:text-white"
              >
                <Icon size={17} weight="bold" />
              </a>
            ))}
          </div>
        </section>

        <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-6 text-white/35">
          Movie data comes from TMDB. Cindr is not endorsed or certified by TMDB.
        </p>
      </main>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-xl" : "max-w-xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-cindr)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}
