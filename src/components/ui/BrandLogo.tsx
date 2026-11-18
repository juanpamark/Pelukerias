import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandLogo({ href = "/", size = "md", className }: BrandLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  const content = (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <span
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-zinc-950 text-white",
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M5 7l7 10L19 7" />
          <path d="M12 17v3" />
          <circle cx="12" cy="5" r="1.6" fill="#10b981" stroke="none" />
        </svg>
      </span>
      <span className={cn("font-extrabold tracking-tight text-zinc-950", textSizes[size])}>
        Velociturno
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950 rounded-lg">
      {content}
    </Link>
  );
}
