import { Link } from "wouter";
import { motion } from "framer-motion";
import { TrendingUp, Star, Sparkles, Tag, ChevronLeft, Award, Zap, Gift, ShieldCheck, Clock3, CheckCircle2 } from "lucide-react";
import { useListProviders, useListCategories } from "@/lib/api-client-react";
import { ProviderCard } from "@/components/provider-card";

const OFFERS = [
  { id: 1, title: "خصم ٢٠٪ على خدمات الكهرباء", sub: "صالح حتى نهاية الشهر", color: "from-[#F5B335] to-[#c9851d]", icon: Zap },
  { id: 2, title: "أول طلب مجاناً للمستخدمين الجدد", sub: "للمستخدمين الجدد فقط", color: "from-[#167d68] to-[#0b5a4d]", icon: Gift },
  { id: 3, title: "خدمة تنظيف شاملة بسعر مميز", sub: "احجز الآن واحصل على عرض خاص", color: "from-[#355e91] to-[#102443]", icon: Sparkles },
];

const BADGES = [
  { icon: Award, label: "الأعلى تقييماً", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { icon: Clock3, label: "الأسرع استجابة", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { icon: ShieldCheck, label: "موثق رسمياً", color: "bg-green-50 text-green-800 border-green-200" },
  { icon: CheckCircle2, label: "تجارب موثوقة", color: "bg-purple-50 text-purple-800 border-purple-200" },
];

export default function Discover() {
  const { data: categories } = useListCategories();
  const providerRefreshOptions = {
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  } as const;
  const { data: topRated } = useListProviders({ limit: 6 }, { query: { queryKey: ['discover-top'], ...providerRefreshOptions } });
  const { data: newest } = useListProviders({ limit: 4, sortBy: 'experience' }, { query: { queryKey: ['discover-new'], ...providerRefreshOptions } });

  return (
    <div className="pb-24" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-[2.5rem] bg-primary px-4 pb-9 pt-7 text-white shadow-[0_14px_30px_rgba(24,45,83,0.16)]">
        <div className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -right-8 h-36 w-36 rounded-full bg-accent/15" />
        <div className="relative mx-auto max-w-md">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-accent text-primary"><Sparkles className="h-4 w-4" /></span>
            <div>
              <p className="text-[10px] font-bold text-white/55">مساحتك لاكتشاف الأفضل</p>
              <h1 className="text-xl font-black">اكتشف</h1>
            </div>
          </div>
          <p className="mt-4 max-w-[280px] text-sm leading-6 text-white/70">أفضل المهنيين والخدمات القريبة منك، مرتبة لتصل إلى قرارك بثقة.</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-8">
        {/* Offers Banner */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              عروض مميزة
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {OFFERS.map((offer) => {
              const OfferIcon = offer.icon;
              return (
              <div
                key={offer.id}
                className={`relative min-w-[228px] shrink-0 overflow-hidden rounded-[22px] bg-gradient-to-br ${offer.color} p-4 text-white shadow-[0_10px_20px_rgba(14,47,98,0.12)]`}
              >
                <div className="absolute -left-4 -top-7 h-24 w-24 rounded-full bg-white/10" />
                <div className="relative mb-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15"><OfferIcon className="h-5 w-5" /></div>
                <p className="relative mb-1 text-sm font-black leading-tight">{offer.title}</p>
                <p className="relative text-xs text-white/70">{offer.sub}</p>
              </div>
              );
            })}
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            شارات التميز
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((b) => {
              const BadgeIcon = b.icon;
              return (
              <div key={b.label} className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-xs font-extrabold ${b.color}`}>
                <BadgeIcon className="h-4 w-4" />
                {b.label}
              </div>
              );
            })}
          </div>
        </section>

        {/* Most Requested Services */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              الأكثر طلباً
            </h2>
            <Link href="/providers" className="text-primary text-xs font-medium flex items-center gap-1">
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(categories ?? []).slice(0, 6).map((cat) => (
              <Link key={cat.id} href={`/providers?categoryId=${cat.id}`}>
                <div className="rounded-2xl bg-card border border-border p-3 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors cursor-pointer">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-center line-clamp-1">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Rated */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Star className="w-4 h-4 text-accent fill-accent" />
              الأعلى تقييماً
            </h2>
            <Link href="/providers?sortBy=rating" className="text-primary text-xs font-medium flex items-center gap-1">
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(topRated?.providers ?? []).slice(0, 4).map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </section>

        {/* Newest Providers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              مهنيون جدد
            </h2>
          </div>
          <div className="space-y-3">
            {(newest?.providers ?? []).slice(0, 4).map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
