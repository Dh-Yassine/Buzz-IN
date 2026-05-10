import type { ImgHTMLAttributes } from "react";

export type MascotVariant = "logo" | "thumbs_up" | "throw_trash";

const SRC: Record<MascotVariant, string> = {
  logo: "/bee_logo.png",
  thumbs_up: "/bee_thumbs_up.png",
  throw_trash: "/bee_throw_trash.png",
};

const sizes = {
  xs: "h-11 w-11 min-h-11 min-w-11",
  sm: "h-16 w-16 min-h-16 min-w-16",
  md: "h-28 w-28 min-h-28 min-w-28",
  lg: "h-36 w-36 min-h-36 min-w-36 md:h-40 md:w-40",
} as const;

type Size = keyof typeof sizes;

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  variant?: MascotVariant;
  size?: Size;
  alt?: string;
};

/**
 * Official BUZZ-IN bee artwork from `/public`. Variants: main logo, thumbs-up, recycling pose.
 */
export function BuzzMascot({
  variant = "logo",
  size = "md",
  className = "",
  alt,
  loading = "lazy",
  decoding = "async",
  ...rest
}: Props) {
  const resolvedAlt =
    alt ??
    (variant === "logo"
      ? "BUZZ-IN mascot"
      : variant === "thumbs_up"
        ? "BUZZ-IN bee thumbs up"
        : "BUZZ-IN bee with recycling bin");

  return (
    <img
      src={SRC[variant]}
      alt={resolvedAlt}
      width={256}
      height={256}
      loading={loading}
      decoding={decoding}
      draggable={false}
      className={`pointer-events-none select-none object-contain drop-shadow-md ${sizes[size]} ${className}`}
      {...rest}
    />
  );
}
