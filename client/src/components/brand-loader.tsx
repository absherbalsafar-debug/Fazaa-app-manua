import { BrandLogo } from "@/components/brand-logo";

type BrandLoadingScreenProps = {
  message?: string;
  overlay?: boolean;
};

export function BrandLoadingScreen({
  message = "جارٍ تحميل فزعة...",
  overlay = false,
}: BrandLoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      dir="rtl"
      className={
        overlay
          ? "fixed inset-0 z-[120] flex min-h-[100dvh] items-center justify-center bg-[#f7f8fa] px-6"
          : "flex min-h-[100dvh] w-full items-center justify-center bg-[#f7f8fa] px-6"
      }
    >
      <div className="flex flex-col items-center">
        <BrandLogo className="h-[112px] w-[92px] object-contain" />
        <div className="mt-4 flex items-center gap-2" aria-hidden="true">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#182d53]" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#f0b046]" style={{ animationDelay: "120ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#182d53]" style={{ animationDelay: "240ms" }} />
        </div>
        <p className="mt-3 text-sm font-semibold text-[#182d53]">{message}</p>
      </div>
    </div>
  );
}
