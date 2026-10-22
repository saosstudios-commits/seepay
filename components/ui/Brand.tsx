import Link from "next/link";

function SeePayMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      width="36"
      height="36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="sp-brand-mark shrink-0"
    >
      <rect width="32" height="32" rx="9" fill="#FFC83D" />
      <path d="M5 8h22v6H5z" fill="#fff" />
      <path d="M5 8h7.33v6H5zM19.67 8H27v6h-7.33z" fill="#E4402F" />
      <circle cx="8.67" cy="14" r="3.67" fill="#E4402F" />
      <circle cx="16" cy="14" r="3.67" fill="#fff" />
      <circle cx="23.33" cy="14" r="3.67" fill="#E4402F" />
      <path
        d="m10.5 23 3.8 3.4 7.2-6.2"
        stroke="#0E3B2C"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 font-bold"
      aria-label="SeePay home"
    >
      <SeePayMark />
      <span className={`sp-brand-wordmark display text-2xl ${light ? "text-white" : "text-[#0B2E21]"}`}>
        SeePay
      </span>
    </Link>
  );
}

export function Awning() {
  return <div className="awning" aria-hidden="true" />;
}

export function SignChip({ slug = "name" }: { slug?: string }) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  return (
    <span className="sign-chip">
      <span style={{ color: "#E4402F" }}>{slug}</span>
      <span>{rootDomain ? `.${rootDomain}` : " · Preview link"}</span>
    </span>
  );
}
