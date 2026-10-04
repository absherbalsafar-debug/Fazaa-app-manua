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
        className={`inline-flex items-center justify-center rounded-xl bg-[#182d53] px-2 py-1 text-center text-sm font-black text-[#f0b046] ${className}`}
      >
        فزعة
      </span>
    );
  }

  return (
    <img
      src="/assets/fazaah-logo-mark.webp"
      alt={alt}
      width={192}
      height={233}
      className={`brand-logo-image ${className}`}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      onError={() => setImageFailed(true)}
      draggable={false}
    />
  );
}
