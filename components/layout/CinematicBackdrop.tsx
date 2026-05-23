export default function CinematicBackdrop({
  density = "balanced",
}: {
  density?: "subtle" | "balanced";
}) {
  const isSubtle = density === "subtle";

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(216,90,48,0.16),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(112,66,44,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_32%)]" />
      <div
        className={`absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,90,48,0.075),transparent_66%)] blur-2xl ${
          isSubtle ? "opacity-45" : "opacity-75"
        }`}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_46%,rgba(255,255,255,0.035)_47%,transparent_49%,transparent_100%)] opacity-40" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:48px_48px]" />
    </div>
  );
}
