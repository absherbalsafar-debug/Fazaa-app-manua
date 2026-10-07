import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetHomeFeed,
  useListFeaturedAdvertisements,
} from "@/lib/api-client-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";
import {
  Search,
  MapPin,
  Bell,
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
  Zap,
  Construction,
  BrickWall,
  Droplets,
  Snowflake,
  Code2,
  PaintRoller,
  Wrench,
  Truck,
  House,
  Sparkles,
  History,
  ClipboardList,
  Heart,
  ArrowLeft,
  Plus,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function CategoryIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  if (normalized.includes("كهرب") || normalized.includes("electric"))
    return <Zap />;
  if (normalized.includes("بناء") || normalized.includes("build"))
    return <BrickWall />;
  if (normalized.includes("مقاول") || normalized.includes("contract"))
    return <Wrench />;
  if (normalized.includes("مهندس") || normalized.includes("engineer"))
    return <Construction />;
  if (normalized.includes("سباك") || normalized.includes("plumb"))
    return <Droplets />;
  if (normalized.includes("تكييف") || normalized.includes("ac"))
    return <Snowflake />;
  if (normalized.includes("برمج") || normalized.includes("develop"))
    return <Code2 />;
  if (normalized.includes("صباغ") || normalized.includes("paint"))
    return <PaintRoller />;
  if (normalized.includes("نقل") || normalized.includes("transport"))
    return <Truck />;
  if (normalized.includes("منزل") || normalized.includes("house"))
    return <House />;
  return <Wrench />;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: feed, isLoading } = useGetHomeFeed({
    lat: undefined,
    lng: undefined,
  });
  const { data: featuredAds = [] } = useListFeaturedAdvertisements();

  const categories = Array.isArray(feed?.categories)
    ? feed.categories.slice(0, 8)
    : [];
  const recentRequests = Array.isArray(feed?.recentRequests)
    ? feed.recentRequests
    : [];
  const featuredAdvertisements = Array.isArray(featuredAds) ? featuredAds : [];
  const firstName = user?.name?.trim().split(/\s+/)[0] || "بك";

  function handleSearch() {
    if (searchQuery.trim())
      navigate(`/providers?search=${encodeURIComponent(searchQuery)}`);
    else navigate("/providers");
  }

  return (
    <div
      className="min-h-[100dvh] bg-background pb-24 text-foreground"
      dir="rtl"
    >
      <header className="border-b border-border/70 bg-card/90 px-4 pb-5 pt-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="flex min-h-11 items-center gap-1.5 rounded-2xl border border-border bg-muted/50 px-3.5 text-xs font-extrabold text-foreground transition hover:bg-muted"
              aria-label="اختيار المدينة"
            >
              <ChevronDown className="h-4 w-4" />
              <span>{user?.city ?? "صنعاء"}</span>
              <MapPin className="h-4 w-4 text-primary" />
            </button>
            <Link href="/" aria-label="الرئيسية" className="home-brand-mark">
              <img src="/assets/fazaah-logo-mark.webp" alt="فزعة" />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground transition hover:bg-muted"
                aria-label="الإشعارات"
              >
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
              </Link>
              <Link href="/profile" aria-label="حسابي">
                <Avatar className="h-11 w-11 border-2 border-accent/50">
                  <AvatarImage
                    src={user?.avatarUrl ?? undefined}
                    alt={user?.name ?? "حسابي"}
                  />
                  <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">
                    {firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <AppPage width="mobile" className="space-y-7 pt-6 sm:pt-8">
        <PageHeading
          eyebrow="صباح الخير"
          title={`أهلًا، ${firstName}`}
          description="ما الخدمة التي تريد إنجازها اليوم؟ نحن نوصلك بمهني موثوق قريب منك."
          action={
            <span className="hidden shrink-0 rounded-full bg-accent/15 px-3 py-2 text-[11px] font-black text-accent-foreground sm:inline-flex">
              جاهز نساعدك
            </span>
          }
          className="mb-0"
        />

        <section className="relative min-h-[222px] overflow-hidden rounded-[30px] bg-primary shadow-[0_18px_40px_rgba(14,47,98,0.18)]">
          <img
            src="/assets/fazaah-hero.svg"
            alt="فني من فزعة"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-primary via-primary/80 to-primary/10" />
          <div className="relative z-10 flex min-h-[222px] max-w-[76%] flex-col justify-center px-5 py-7 text-primary-foreground sm:px-7">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[10px] font-black text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> فزعة أقرب لك
            </span>
            <h2 className="mt-3 text-[27px] font-black leading-[1.25] sm:text-3xl">
              تحتاج خدمة؟
              <span className="block text-accent">نوصلك بالمناسب</span>
            </h2>
            <p className="mt-2 text-xs leading-5 text-primary-foreground/75">
              اطلب مهنيًا موثوقًا قريبًا منك خلال دقائق.
            </p>
            <button
              type="button"
              onClick={() => navigate("/request/new")}
              className="mt-5 flex min-h-11 w-fit items-center gap-2 rounded-2xl bg-card px-4 text-xs font-black text-primary shadow-lg transition hover:-translate-y-0.5 active:scale-95"
            >
              اطلب خدمة الآن <ArrowLeft className="h-4 w-4 text-accent" />
            </button>
          </div>
        </section>

        <SurfaceCard className="p-2.5">
          <div className="flex min-h-14 items-center gap-2 rounded-2xl bg-muted/55 px-3">
            <Search className="h-5 w-5 shrink-0 text-primary" />
            <Input
              type="text"
              placeholder="ما الخدمة التي تحتاجها؟"
              className="h-12 border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              onKeyDown={event => event.key === "Enter" && handleSearch()}
            />
            <button
              type="button"
              onClick={() => navigate("/providers")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm"
              aria-label="تصفية البحث"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="mt-2.5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black text-primary-foreground transition hover:bg-primary/90"
          >
            <Search className="h-4 w-4 text-accent" /> بحث عن مهني أو خدمة
          </button>
        </SurfaceCard>

        <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <Link
            href="/request/new"
            className="group flex min-h-[68px] items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-3 transition hover:border-accent"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-xs font-black leading-4">طلب جديد</span>
          </Link>
          <Link
            href="/my-requests"
            className="group flex min-h-[68px] items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/30"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="text-xs font-black leading-4">طلباتي</span>
          </Link>
          <Link
            href="/favorites"
            className="group flex min-h-[68px] items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/30"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </span>
            <span className="text-xs font-black leading-4">المفضلة</span>
          </Link>
        </section>

        <section>
          <SectionHeading
            title="تصفح حسب الخدمة"
            action={
              <Link
                href="/providers"
                className="flex min-h-10 items-center gap-1 text-xs font-bold text-primary"
              >
                عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {categories.map(category => (
                <Link
                  key={category.id}
                  href={`/providers?categoryId=${category.id}`}
                >
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className="flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_6px_18px_rgba(14,47,98,0.04)] transition hover:border-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CategoryIcon
                        name={`${category.name} ${category.icon ?? ""}`}
                      />
                    </div>
                    <span className="max-w-full truncate px-1 text-xs font-bold">
                      {category.name}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={isLoading ? LoaderCircle : Wrench}
              title={
                isLoading ? "نجهز لك الخدمات" : "لا توجد أنواع خدمات حاليًا"
              }
              description={
                isLoading
                  ? "لحظات ونرتب لك الخدمات المتاحة."
                  : "يمكنك العودة لاحقًا أو البحث عن مهني مباشرة."
              }
              action={
                !isLoading ? (
                  <Link
                    href="/providers"
                    className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-4 text-xs font-black text-primary-foreground"
                  >
                    استعرض المهنيين
                  </Link>
                ) : undefined
              }
            />
          )}
        </section>

        <SurfaceCard className="relative overflow-hidden border-accent/20 bg-accent/10 p-5">
          <div className="relative z-10 max-w-[76%]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h2 className="text-base font-black">مهنيون موثوقون</h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              اختر من قائمة المهنيين المعتمدين وتواصل بثقة.
            </p>
            <Link
              href="/providers"
              className="mt-4 inline-flex min-h-10 items-center gap-1 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground"
            >
              استعرض المهنيين <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="absolute -bottom-10 -left-5 flex h-32 w-32 items-center justify-center rounded-full bg-accent/20">
            <ShieldCheck className="h-16 w-16 text-accent/60" />
          </div>
        </SurfaceCard>

        {featuredAdvertisements.length > 0 && (
          <section>
            <SectionHeading
              title="مهنيون مميزون"
              action={
                <span className="rounded-full bg-accent/15 px-2.5 py-1.5 text-[10px] font-bold text-accent-foreground">
                  إعلانات مدفوعة
                </span>
              }
            />
            <div className="space-y-3">
              {featuredAdvertisements.slice(0, 3).map(ad => (
                <Link key={ad.id} href={`/providers/${ad.providerId}`}>
                  <article className="overflow-hidden rounded-2xl border border-accent/30 bg-card shadow-[0_6px_18px_rgba(14,47,98,0.05)]">
                    {ad.imageUrl && (
                      <img
                        src={ad.imageUrl}
                        alt=""
                        className="h-32 w-full object-cover"
                      />
                    )}
                    <div className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {ad.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {ad.providerName || "مهني موصى به"} · {ad.city}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[9px] font-black text-accent-foreground">
                          إعلان
                        </span>
                      </div>
                      {ad.description && (
                        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                          {ad.description}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeading
            title="آخر طلباتك"
            action={
              <Link
                href="/my-requests"
                className="flex min-h-10 items-center gap-1 text-xs font-bold text-primary"
              >
                عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {recentRequests.length ? (
            <div className="space-y-3">
              {recentRequests.map(request => (
                <Link key={request.id} href={`/my-requests/${request.id}`}>
                  <article className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_6px_18px_rgba(14,47,98,0.04)]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-[10px] font-black text-primary">
                      {request.isImmediate ? "عاجل" : "طلب"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">
                        {request.serviceType}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {user?.role === "provider"
                          ? request.clientName
                          : request.providerName || "بانتظار المهني"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1.5 text-[10px] font-bold text-accent-foreground">
                      {request.status === "pending"
                        ? "قيد الانتظار"
                        : request.status === "accepted"
                          ? "مقبول"
                          : request.status === "completed"
                            ? "مكتمل"
                            : request.status === "cancelled"
                              ? "ملغي"
                              : "قيد المتابعة"}
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="لا توجد طلبات محفوظة"
              description="ابدأ الآن باختيار خدمة أو مهني مناسب."
              action={
                <button
                  type="button"
                  onClick={() => navigate("/providers")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-xs font-black text-primary-foreground"
                >
                  اكتشف المهنيين <ArrowLeft className="h-4 w-4 text-accent" />
                </button>
              }
            />
          )}
        </section>
      </AppPage>
    </div>
  );
}
