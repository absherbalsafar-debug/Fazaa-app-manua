import { useRoute, Link } from "wouter";
import {
  useGetProvider,
  useGetProviderReviews,
  useGetProviderPortfolio,
  useAddFavorite,
  useRemoveFavorite,
  useTrackProviderContactClick,
} from "@/lib/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  CheckCircle2,
  Heart,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Clock,
  CalendarDays,
  MessageCircle,
  Phone,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { maskPhone, toTelHref, toWhatsAppHref } from "@/lib/contact";
import {
  AppPage,
  EmptyState,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

export default function ProviderDetail() {
  const [, params] = useRoute("/providers/:id");
  const id = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: provider,
    isLoading,
    refetch,
  } = useGetProvider(id, {
    query: { enabled: !!id, queryKey: ["provider", id] },
  });

  const { data: reviews } = useGetProviderReviews(id, {
    query: { enabled: !!id, queryKey: ["reviews", id] },
  });

  const { data: portfolio } = useGetProviderPortfolio(id, {
    query: { enabled: !!id, queryKey: ["portfolio", id] },
  });

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const trackContactClick = useTrackProviderContactClick();

  const toggleFavorite = () => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }

    if (provider?.isFavorited) {
      removeFavorite.mutate({ providerId: id }, { onSuccess: () => refetch() });
    } else {
      addFavorite.mutate({ providerId: id }, { onSuccess: () => refetch() });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
        <div className="h-16 bg-primary" />
        <AppPage width="mobile" className="pt-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-28 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[1, 2, 3].map(item => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 pt-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> جارٍ تجهيز
            ملف المهني...
          </div>
        </AppPage>
      </div>
    );
  }

  if (!provider) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-background px-6 text-center"
        dir="rtl"
      >
        <SurfaceCard className="max-w-sm p-7">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Briefcase className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-black">
            لم نتمكن من العثور على هذا المهني
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            قد يكون الملف غير متاح مؤقتًا. استعرض بقية المهنيين للعثور على خيار
            مناسب.
          </p>
          <Link href="/providers">
            <Button className="mt-5 min-h-12 w-full rounded-xl">
              استعراض المهنيين
            </Button>
          </Link>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-primary/95 px-4 py-3 text-white shadow-sm backdrop-blur-md sm:px-6">
        <Link href="/providers">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl text-white hover:bg-white/10 hover:text-white"
            aria-label="العودة إلى المهنيين"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-sm font-extrabold sm:text-base">ملف المهني</h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-2xl text-white hover:bg-white/10 hover:text-white"
          onClick={toggleFavorite}
          aria-label={
            provider.isFavorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"
          }
        >
          <Heart
            className={`h-5 w-5 ${provider.isFavorited ? "fill-destructive text-destructive" : ""}`}
          />
        </Button>
      </div>

      <AppPage width="content" className="app-stage premium-surface">
        <SurfaceCard className="relative overflow-hidden border-primary/10 px-5 py-7 sm:px-8 sm:py-9">
          <div
            className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-card shadow-xl sm:h-32 sm:w-32">
                <AvatarImage
                  src={provider.avatarUrl || ""}
                  alt={provider.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
                  {provider.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {provider.isVerified && (
                <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {provider.name}
              </h2>
              {provider.isVerified && (
                <Badge className="gap-1 rounded-full bg-green-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-green-500">
                  <CheckCircle2 className="h-3.5 w-3.5" /> موثق
                </Badge>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary hover:bg-primary/15"
              >
                <span className="ml-1.5 text-base">
                  {provider.categoryIcon}
                </span>
                {provider.categoryName}
              </Badge>
              {provider.isAvailable && (
                <Badge className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-500/10">
                  متاح الآن ⚡
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>
                  {provider.city}، {provider.district}
                </span>
              </div>
              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/30 sm:block" />
              <div className="flex items-center gap-1.5 font-bold text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                <span>
                  {provider.rating.toFixed(1)} ({provider.reviewCount})
                </span>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
          <SurfaceCard className="flex flex-col items-center justify-center px-2 py-4 text-center sm:py-5">
            <Briefcase className="mb-2 h-5 w-5 text-primary" />
            <div className="text-lg font-black">{provider.completedJobs}</div>
            <div className="mt-1 text-xs text-muted-foreground">مهمة منجزة</div>
          </SurfaceCard>
          <SurfaceCard className="flex flex-col items-center justify-center px-2 py-4 text-center sm:py-5">
            <Clock className="mb-2 h-5 w-5 text-primary" />
            <div className="text-lg font-black">{provider.yearsExperience}</div>
            <div className="mt-1 text-xs text-muted-foreground">سنوات خبرة</div>
          </SurfaceCard>
          <SurfaceCard className="flex flex-col items-center justify-center px-2 py-4 text-center sm:py-5">
            <CheckCircle2 className="mb-2 h-5 w-5 text-green-600" />
            <div className="text-base font-black text-green-600">متاح</div>
            <div className="mt-1 text-xs text-muted-foreground">
              للعمل فوراً
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="mt-5 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/request/new?providerId=${provider.id}`}
              className="sm:col-span-2"
            >
              <Button className="min-h-13 w-full rounded-2xl bg-accent text-base font-black text-primary shadow-md shadow-accent/20 hover:bg-accent/90">
                <CalendarDays className="ml-2 h-5 w-5" />
                طلب خدمة
              </Button>
            </Link>
            {provider.phone && (
              <a
                href={toTelHref(provider.phone)}
                onClick={() =>
                  trackContactClick.mutate({ id, data: { kind: "call" } })
                }
              >
                <Button
                  variant="outline"
                  className="min-h-12 w-full rounded-2xl border-primary/25 text-primary hover:bg-primary/5"
                >
                  <Phone className="ml-2 h-5 w-5" />
                  اتصال
                </Button>
              </a>
            )}
            {provider.whatsapp && (
              <a
                href={toWhatsAppHref(provider.whatsapp)}
                onClick={() =>
                  trackContactClick.mutate({ id, data: { kind: "whatsapp" } })
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="min-h-12 w-full rounded-2xl border-green-600/40 text-green-700 hover:bg-green-50"
                >
                  <MessageCircle className="ml-2 h-5 w-5" />
                  واتساب
                </Button>
              </a>
            )}
          </div>
          {(provider.phone || provider.whatsapp) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
              {provider.phone && (
                <span>
                  الهاتف:{" "}
                  <b dir="ltr" className="text-foreground">
                    {maskPhone(provider.phone)}
                  </b>
                </span>
              )}
              {provider.whatsapp && (
                <span>
                  واتساب:{" "}
                  <b dir="ltr" className="text-foreground">
                    {maskPhone(provider.whatsapp)}
                  </b>
                </span>
              )}
            </div>
          )}
        </SurfaceCard>

        <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
          {provider.bio && (
            <SurfaceCard className="p-5 sm:p-6">
              <SectionHeading title="نبذة عن المهني" />
              <p className="text-sm leading-7 text-muted-foreground">
                {provider.bio}
              </p>
            </SurfaceCard>
          )}

          <SurfaceCard className="p-5 sm:p-6">
            <SectionHeading
              title="معرض الأعمال"
              description={
                portfolio && portfolio.length > 0
                  ? "نماذج من أعمال المهني السابقة"
                  : undefined
              }
            />
            {portfolio && portfolio.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolio.map(item => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl bg-muted"
                  >
                    <div className="aspect-square">
                      <img
                        src={item.imageUrl}
                        alt={item.description || ""}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    {item.description && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                        <p className="line-clamp-2 text-xs font-medium text-white">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40"
                    >
                      <ImageIcon className="h-6 w-6 text-muted-foreground/25" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  لم يُضف المهني صور أعمال بعد
                </p>
              </>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <SectionHeading
              title="التقييمات والآراء"
              action={
                <div className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 text-sm font-black text-amber-600">
                  <Star className="h-4 w-4 fill-current" />
                  {Number(provider.rating ?? 0).toFixed(1)}
                </div>
              }
            />
            {reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map(review => (
                  <div key={review.id} className="rounded-2xl bg-muted/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={review.clientAvatarUrl || ""} />
                          <AvatarFallback>
                            {review.clientName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-extrabold">
                          {review.clientName || "عميل"}
                        </span>
                      </div>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < review.rating ? "fill-current" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="لا توجد تقييمات منشورة بعد"
                description="كن أول من يقيّم تجربة الخدمة."
                className="py-8"
              />
            )}
          </SurfaceCard>
        </div>
      </AppPage>
    </div>
  );
}
