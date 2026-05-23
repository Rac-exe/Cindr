type CindrLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function CindrLogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className={`shrink-0 text-[var(--color-cindr)] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="14" fill="#0f0e13" />
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="11.5"
        stroke="currentColor"
        strokeOpacity="0.24"
      />
      <g transform="translate(24 24) scale(1.14) translate(-24 -24)">
        <path
          d="M31.5 13.5a13 13 0 1 0 0 21"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M20.5 15.5h6M17.5 21.5h6M17.5 27.5h6M20.5 33.5h6"
          stroke="#FAECE7"
          strokeOpacity="0.78"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M28 19.5v9l7-4.5-7-4.5Z" fill="#FAECE7" />
        <circle cx="34.5" cy="13.5" r="2.5" fill="currentColor" />
        <circle cx="34.5" cy="34.5" r="2.5" fill="currentColor" />
      </g>
    </svg>
  );
}

export default function CindrLogo({
  className = "",
  markClassName = "h-8 w-8",
  textClassName = "text-xl",
}: CindrLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <CindrLogoMark className={markClassName} />
      <span className={`font-semibold tracking-tight ${textClassName}`}>
        Cin<span className="text-[var(--color-cindr)]">dr</span>
      </span>
    </span>
  );
}
