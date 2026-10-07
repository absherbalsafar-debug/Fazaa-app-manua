import { useState } from "react";

type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export function BrandLogo({
  className = "h-auto w-32",
  alt = "فزعة — احتياجك .. نوصلك بالشخص المناسب",
}: BrandLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`inline-flex items-center justify-center rounded-xl bg-[#102443] px-2 py-1 text-center text-sm font-black text-[#F5B335] ${className}`}
      >
        فزعة
      </span>
    );
  }

  return (
    <img
      src="/assets/fazaah-logo.png"
      alt={alt}
      width={964}
      height={1172}
      className={`brand-logo-image ${className}`}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      onError={() => setImageFailed(true)}
      draggable={false}
    />
  );
}
