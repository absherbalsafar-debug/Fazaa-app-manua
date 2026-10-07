import {
  ProviderSummary,
  useTrackProviderContactClick,
} from "@/lib/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle2, Briefcase, Zap } from "lucide-react";
import { MessageCircle, Phone } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { maskPhone, toTelHref, toWhatsAppHref } from "@/lib/contact";

interface ProviderCardProps {
  provider: ProviderSummary;
  compact?: boolean;
}

export function ProviderCard({ provider, compact = false }: ProviderCardProps) {
  const trackContactClick = useTrackProviderContactClick();
  const rating = Number(provider.rating ?? 0);
  const completedJobs = Number(provider.completedJobs ?? 0);
  const yearsExperience = Number(provider.yearsExperience ?? 0);
  const providerName = provider.name || "مهني فزعة";

  if (compact) {
    return (
      <Link href={`/providers/${provider.id}`}>
        <article className="group w-44 shrink-0 rounded-3xl border border-border/80 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
          <div className="relative mb-3">
            <Avatar className="h-32 w-full rounded-2xl">
              <AvatarImage
                src={provider.avatarUrl || ""}
                alt={providerName}
                className="object-cover"
              />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                {providerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {provider.isAvailable && (
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                متاح
              </span>
            )}
            {provider.isVerified && (
              <span
                className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-primary shadow-sm"
                aria-label="موثق"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <p className="truncate text-sm font-extrabold text-foreground">
            {providerName}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {provider.categoryName || "خدمات مهنية"}
          </p>
          {provider.specialty && (
            <p className="mt-2 truncate rounded-full bg-accent/15 px-2 py-1 text-[10px] font-bold text-amber-800">
              التخصص الفرعي: {provider.specialty}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-extrabold text-foreground">
                {rating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {completedJobs} مشروع
            </span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <motion.article
      whileTap={{ scale: 0.99 }}
      className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-lg"
    >
      <Link
        href={`/providers/${provider.id}`}
        className="block focus-visible:outline-none"
      >
        <div className="p-5 sm:p-6">
          <div className="flex gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-[4.5rem] w-[4.5rem] rounded-2xl border border-primary/10 sm:h-20 sm:w-20">
                <AvatarImage
                  src={provider.avatarUrl || ""}
                  alt={providerName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                  {providerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {provider.isAvailable && (
                <span
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card bg-green-500"
                  aria-label="متاح الآن"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-base font-extrabold text-foreground">
                      {providerName}
                    </h3>
                    {provider.isVerified && (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 fill-primary/10 text-primary"
                        aria-label="موثق"
                      />
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                    <span aria-hidden="true">{provider.categoryIcon}</span>
                    <span className="font-medium">
                      {provider.categoryName || "خدمات مهنية"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-xl bg-accent/15 px-2.5 py-1.5 text-sm font-extrabold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  {rating.toFixed(1)}
                </div>
              </div>

              {provider.specialty && (
                <span className="mt-2 inline-flex max-w-full truncate rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                  التخصص الفرعي: {provider.specialty}
                </span>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span className="truncate">{provider.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span>{completedJobs} مشروع</span>
                </div>
                {yearsExperience > 0 && (
                  <span>{yearsExperience} سنوات خبرة</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {provider.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] font-bold text-primary">
                <CheckCircle2 className="h-3 w-3" /> موثق
              </span>
            )}
            {provider.isAvailable && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                <Zap className="h-3 w-3 fill-current" /> متاح الآن
              </span>
            )}
            {provider.distanceKm != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {provider.distanceKm.toFixed(1)}{" "}
                كم
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-3 border-t border-border/70 bg-background/35 px-5 py-2.5 text-[11px] text-muted-foreground sm:px-6">
        <span dir="ltr">{maskPhone(provider.phone)}</span>
        {provider.whatsapp && (
          <span dir="ltr">واتساب: {maskPhone(provider.whatsapp)}</span>
        )}
      </div>
      <div className="grid border-t border-border/70 text-xs font-extrabold sm:grid-cols-3">
        <Link
          href={`/request/new?providerId=${provider.id}`}
          className="flex min-h-12 items-center justify-center text-primary transition-colors hover:bg-primary/5"
        >
          طلب خدمة
        </Link>
        <a
          href={toTelHref(provider.phone)}
          className="flex min-h-12 items-center justify-center gap-1.5 border-t border-border/70 text-primary transition-colors hover:bg-primary/5 sm:border-r sm:border-t-0"
          onClick={event => event.stopPropagation()}
          onMouseDown={() =>
            trackContactClick.mutate({
              id: provider.id,
              data: { kind: "call" },
            })
          }
        >
          <Phone className="h-4 w-4" />
          اتصال
        </a>
        {provider.whatsapp ? (
          <a
            href={toWhatsAppHref(provider.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-1.5 border-t border-border/70 text-green-700 transition-colors hover:bg-green-50 sm:border-r"
            onClick={event => event.stopPropagation()}
            onMouseDown={() =>
              trackContactClick.mutate({
                id: provider.id,
                data: { kind: "whatsapp" },
              })
            }
          >
            <MessageCircle className="h-4 w-4" />
            واتساب
          </a>
        ) : (
          <span className="hidden sm:block" />
        )}
      </div>
    </motion.article>
  );
}
