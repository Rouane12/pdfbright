export type FreeToolIconName =
  | "readiness"
  | "scan"
  | "send"
  | "search"
  | "consistency"
  | "changes";

export function FreeToolIcon({ name }: { name: FreeToolIconName }) {
  const shared = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "readiness") {
    return (
      <svg {...shared}>
        <path d="M9 5h6" />
        <path d="M9 3h6a2 2 0 0 1 2 2v1h2v15H5V6h2V5a2 2 0 0 1 2-2Z" />
        <path d="m8 13 2.3 2.3L16 9.7" />
      </svg>
    );
  }

  if (name === "scan") {
    return (
      <svg {...shared}>
        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
        <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
        <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="M7 12h10" />
        <path d="M8 9h8" />
        <path d="M9 15h6" />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg {...shared}>
        <path d="M12 3 5.5 5.8v5.1c0 4.1 2.5 7.8 6.5 10.1 4-2.3 6.5-6 6.5-10.1V5.8L12 3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...shared}>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 5 5" />
        <path d="M8 9h5" />
        <path d="M8 12h3" />
      </svg>
    );
  }

  if (name === "consistency") {
    return (
      <svg {...shared}>
        <rect x="4" y="4" width="6" height="7" rx="1" />
        <rect x="14" y="4" width="6" height="7" rx="1" />
        <rect x="4" y="15" width="6" height="5" rx="1" />
        <rect x="14" y="15" width="6" height="5" rx="1" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <path d="M7 4h8l3 3v13H7z" />
      <path d="M15 4v4h4" />
      <path d="m9.5 12 2-2 2 2" />
      <path d="M11.5 10v6" />
      <path d="m14.5 14 2 2 2-2" />
    </svg>
  );
}
