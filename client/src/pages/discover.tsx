import { Link } from "wouter";
import {
  TrendingUp,
  Star,
  Sparkles,
  Tag,
  ChevronLeft,
  Award,
  Zap,
  Gift,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { useListProviders, useListCategories } from "@/lib/api-client-react";
import { ProviderCard } from "@/components/provider-card";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

const OFFERS = [
  {
    id: 1,
    title: "خصم ٢٠٪ على خدمات الكهرباء",
    sub: "صالح حتى نهاية الشهر",
    color: "from-[#f0b046] to-[#c9851d]",
    icon: Zap,
  },
  {
    id: 2,
    title: "أول طلب مجاناً للمستخدمين الجدد",
    sub: "للمستخدمين الجدد فقط",
    color: "from-[#167d68] to-[#0b5a4d]",
    icon: Gift,
  },
  {
    id: 3,
    title: "خدمة تنظيف شاملة بسعر مميز",
    sub: "احجز الآن واحصل على عرض خاص",
    color: "from-[#355e91] to-[#182d53]",
    icon: Sparkles,
  },
];

const BADGES = [
  {
    icon: Award,
    label: "الأعلى تقييماً",
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    icon: Clock3,
    label: "الأسرع استجابة",
    color: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    icon: ShieldCheck,
    label: "موثق رسمياً",
    color: "bg-green-50 text-green-800 border-green-200",
  },
  {
    icon: CheckCircle2,
    label: "تجارب موثوقة",
    color: "bg-purple-50 text-purple-800 border-purple-200",
  },
];

export default function Discover() {
  const { data: categories, isLoading: categoriesLoading } =
    useListCategories();
  const providerRefreshOptions = {
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  } as const;
  const { data: topRated, isLoading: topRatedLoading } = useListProviders(
    { limit: 6 },
    { query: { queryKey: ["discover-top"], ...providerRefreshOptions } }
  );
  const { data: newest, isLoading: newestLoading } = useListProviders(
    { limit: 4, sortBy: "experience" },
    { query: { queryKey: ["discover-new"], ...providerRefreshOptions } }
  );
  const topProviders = (topRated?.providers ?? []).slice(0, 4);
  const newProviders = (newest?.providers ?? []).slice(0, 4);
  const serviceCategories = (categories ?? []).slice(0, 6);

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <AppPage width="content" className="space-y-8 pt-6 sm:pt-10">
        <PageHeading
          eyebrow="مساحتك لاكتشاف الأفضل"
          title="اكتشف"
          description="أفضل المهنيين والخدمات القريبة منك، مرتبة لتصل إلى قرارك بثقة."
          action={
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
          }
          className="mb-0"
        />

        <section>
          <SectionHeading
            title="عروض مميزة"
            description="فرص موفرة لمساعدتك على البدء."
            action={<Tag className="h-5 w-5 text-accent" />}
          />
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
            {OFFERS.map(offer => {
              const OfferIcon = offer.icon;
              return (
                <SurfaceCard
                  key={offer.id}
                  className={`relative min-w-[240px] shrink-0 overflow-hidden border-0 bg-gradient-to-br ${offer.color} p-4 text-white shadow-[0_10px_20px_rgba(14,47,98,0.12)]`}
                >
                  <div className="absolute -left-4 -top-7 h-24 w-24 rounded-full bg-white/10" />
                  <div className="relative mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                    <OfferIcon className="h-5 w-5" />
                  </div>
                  <p className="relative mb-1 text-sm font-black leading-tight">
                    {offer.title}
                  </p>
                  <p className="relative text-xs text-white/75">{offer.sub}</p>
                </SurfaceCard>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            title="شارات التميز"
            description="مؤشرات تساعدك على اختيار الأنسب."
            action={<Award className="h-5 w-5 text-primary" />}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BADGES.map(badge => {
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-extrabold ${badge.color}`}
                >
                  <BadgeIcon className="h-5 w-5" />
                  {badge.label}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            title="الأكثر طلباً"
            description="خدمات قريبة تبدأ منها بحثك."
            action={
              <Link
                href="/providers"
                className="flex min-h-10 items-center gap-1 text-xs font-bold text-primary"
              >
                عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {categoriesLoading ? (
            <EmptyState
              icon={LoaderCircle}
              title="نجهز الخدمات الأكثر طلبًا"
              description="لحظات ونظهر لك التصنيفات المتاحة."
            />
          ) : serviceCategories.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {serviceCategories.map(cat => (
                <Link key={cat.id} href={`/providers?categoryId=${cat.id}`}>
                  <div className="flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_6px_18px_rgba(14,47,98,0.04)] transition hover:border-primary/40">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                      {cat.icon}
                    </span>
                    <span className="line-clamp-1 text-center text-xs font-bold">
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="لا توجد خدمات معروضة حاليًا"
              description="يمكنك استعراض جميع المهنيين أو المحاولة لاحقًا."
              action={
                <Link
                  href="/providers"
                  className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-4 text-xs font-black text-primary-foreground"
                >
                  استعرض المهنيين
                </Link>
              }
            />
          )}
        </section>

        <section>
          <SectionHeading
            title="الأعلى تقييماً"
            description="مهنيون يثق بهم المستخدمون."
            action={
              <Link
                href="/providers?sortBy=rating"
                className="flex min-h-10 items-center gap-1 text-xs font-bold text-primary"
              >
                عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {topRatedLoading ? (
            <EmptyState
              icon={LoaderCircle}
              title="نبحث عن أفضل المهنيين"
              description="نحدّث القائمة لتظهر لك النتائج المناسبة."
            />
          ) : topProviders.length ? (
            <div className="space-y-3">
              {topProviders.map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Star}
              title="لا توجد نتائج بعد"
              description="جرّب استعراض المهنيين من القائمة الكاملة."
              action={
                <Link
                  href="/providers"
                  className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-4 text-xs font-black text-primary-foreground"
                >
                  عرض المهنيين
                </Link>
              }
            />
          )}
        </section>

        <section>
          <SectionHeading
            title="مهنيون جدد"
            description="انضموا حديثًا إلى مجتمع فزعة."
            action={<Sparkles className="h-5 w-5 text-primary" />}
          />
          {newestLoading ? (
            <EmptyState
              icon={LoaderCircle}
              title="نجهز أحدث الإضافات"
              description="لحظات ونظهر لك المهنيين الجدد."
            />
          ) : newProviders.length ? (
            <div className="space-y-3">
              {newProviders.map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="لا يوجد مهنيون جدد حاليًا"
              description="استكشف القائمة الكاملة للعثور على الخدمة المناسبة."
              action={
                <Link
                  href="/providers"
                  className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-4 text-xs font-black text-primary-foreground"
                >
                  استكشف الكل
                </Link>
              }
            />
          )}
        </section>
      </AppPage>
    </div>
  );
}
