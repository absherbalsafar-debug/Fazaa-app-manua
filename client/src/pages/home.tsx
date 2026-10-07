import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetHomeFeed, useListFeaturedAdvertisements } from "@/lib/api-client-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";

function CategoryIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  if (normalized.includes("كهرب") || normalized.includes("electric")) return <Zap />;
  if (normalized.includes("بناء") || normalized.includes("build")) return <BrickWall />;
  if (normalized.includes("مقاول") || normalized.includes("contract")) return <Wrench />;
  if (normalized.includes("مهندس") || normalized.includes("engineer")) return <Construction />;
  if (normalized.includes("سباك") || normalized.includes("plumb")) return <Droplets />;
  if (normalized.includes("تكييف") || normalized.includes("ac")) return <Snowflake />;
  if (normalized.includes("برمج") || normalized.includes("develop")) return <Code2 />;
  if (normalized.includes("صباغ") || normalized.includes("paint")) return <PaintRoller />;
  if (normalized.includes("نقل") || normalized.includes("transport")) return <Truck />;
  if (normalized.includes("منزل") || normalized.includes("house")) return <House />;
  return <Wrench />;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: feed, isLoading } = useGetHomeFeed({ lat: undefined, lng: undefined });
  const { data: featuredAds = [] } = useListFeaturedAdvertisements();

  const categories = Array.isArray(feed?.categories) ? feed.categories.slice(0, 8) : [];
  const recentRequests = Array.isArray(feed?.recentRequests) ? feed.recentRequests : [];
  const featuredAdvertisements = Array.isArray(featuredAds) ? featuredAds : [];
  const firstName = user?.name?.trim().split(/\s+/)[0] || "بك";

  function handleSearch() {
    if (searchQuery.trim()) navigate(`/providers?search=${encodeURIComponent(searchQuery)}`);
    else navigate("/providers");
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24 text-foreground" dir="rtl">
      <header className="border-b border-border/70 bg-card/90 px-4 pb-3 pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <button type="button" className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-2 text-[11px] font-bold text-foreground transition hover:bg-muted" aria-label="اختيار المدينة">
              <ChevronDown className="h-3.5 w-3.5" />
              <span>{user?.city ?? "صنعاء"}</span>
              <MapPin className="h-4 w-4 text-primary" />
            </button>
            <Link href="/" aria-label="الرئيسية" className="home-brand-mark"><BrandLogo className="h-full w-full object-contain" /></Link>
            <div className="flex items-center gap-2">
              <Link href="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted" aria-label="الإشعارات">
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
              </Link>
              <Link href="/profile" aria-label="حسابي">
                <Avatar className="h-10 w-10 border-2 border-accent/50">
                  <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "حسابي"} />
                  <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">{firstName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">صباح الخير</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">أهلًا، {firstName}</h1>
            </div>
            <span className="rounded-full bg-accent/15 px-3 py-1.5 text-[10px] font-black text-accent-foreground">جاهز نساعدك</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 pt-5">
        <section className="relative min-h-[190px] overflow-hidden rounded-[28px] bg-primary shadow-[0_18px_40px_rgba(14,47,98,0.2)]">
          <img src="/assets/fazaah-hero.svg" alt="فني من فزعة" className="absolute inset-0 h-full w-full object-cover object-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-l from-primary via-primary/80 to-primary/10" />
          <div className="relative z-10 flex min-h-[190px] max-w-[68%] flex-col justify-center px-5 py-6 text-primary-foreground">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[10px] font-black text-accent-foreground"><Sparkles className="h-3.5 w-3.5" /> فزعة أقرب لك</span>
            <h2 className="mt-3 text-[26px] font-black leading-[1.25]">تحتاج خدمة؟<span className="block text-accent">نوصلك بالمناسب</span></h2>
            <p className="mt-2 text-[11px] leading-5 text-primary-foreground/75">اطلب مهنيًا موثوقًا قريبًا منك خلال دقائق.</p>
            <button type="button" onClick={() => navigate("/request/new")} className="mt-4 flex w-fit items-center gap-2 rounded-full bg-card px-4 py-2.5 text-xs font-black text-primary shadow-lg transition active:scale-95">
              اطلب خدمة الآن <ArrowLeft className="h-4 w-4 text-accent" />
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-border bg-card p-2 shadow-[0_10px_28px_rgba(14,47,98,0.07)]">
          <div className="flex h-14 items-center gap-2 rounded-[18px] bg-muted/55 px-3">
            <Search className="h-5 w-5 shrink-0 text-primary" />
            <Input type="text" placeholder="ما الخدمة التي تحتاجها؟" className="h-12 border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleSearch()} />
            <button type="button" onClick={() => navigate("/providers")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm" aria-label="تصفية البحث"><SlidersHorizontal className="h-4 w-4" /></button>
          </div>
          <button type="button" onClick={handleSearch} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-primary text-xs font-black text-primary-foreground transition hover:bg-primary/90"><Search className="h-4 w-4 text-accent" /> بحث عن مهني أو خدمة</button>
        </section>

        <section className="grid grid-cols-3 gap-2.5">
          <Link href="/request/new" className="group flex items-center gap-2 rounded-[18px] border border-accent/30 bg-accent/10 p-3 transition hover:border-accent">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Plus className="h-5 w-5" /></span><span className="text-[11px] font-black leading-4">طلب جديد</span>
          </Link>
          <Link href="/my-requests" className="group flex items-center gap-2 rounded-[18px] border border-border bg-card p-3 transition hover:border-primary/30">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ClipboardList className="h-5 w-5" /></span><span className="text-[11px] font-black leading-4">طلباتي</span>
          </Link>
          <Link href="/favorites" className="group flex items-center gap-2 rounded-[18px] border border-border bg-card p-3 transition hover:border-primary/30">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Heart className="h-5 w-5" /></span><span className="text-[11px] font-black leading-4">المفضلة</span>
          </Link>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between"><Link href="/providers" className="flex items-center gap-1 text-[11px] font-bold text-primary">عرض الكل <ChevronLeft className="h-3.5 w-3.5" /></Link><div className="flex items-center gap-2"><span className="h-1 w-7 rounded-full bg-accent" /><h2 className="text-[16px] font-black">تصفح حسب الخدمة</h2></div></div>
          {categories.length > 0 ? <div className="grid grid-cols-4 gap-2.5">{categories.map((category) => <Link key={category.id} href={`/providers?categoryId=${category.id}`}><motion.div whileTap={{ scale: 0.95 }} className="flex h-[100px] flex-col items-center justify-center gap-2 rounded-[18px] border border-border bg-card text-foreground shadow-sm transition hover:border-accent"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CategoryIcon name={`${category.name} ${category.icon ?? ""}`} /></div><span className="max-w-full truncate px-1 text-[10px] font-bold">{category.name}</span></motion.div></Link>)}</div> : <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground">{isLoading ? "جاري تحميل أنواع الخدمات..." : "لا توجد أنواع خدمات مضافة حاليًا"}</div>}
          {isLoading && <p className="mt-2 text-center text-[10px] text-muted-foreground">نجهز لك خدمات قريبة منك...</p>}
        </section>

        <section className="relative overflow-hidden rounded-[22px] border border-accent/20 bg-accent/10 p-5">
          <div className="relative z-10 max-w-[72%]"><div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent" /><h2 className="text-[15px] font-black">مهنيون موثوقون</h2></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">اختر من قائمة المهنيين المعتمدين وتواصل بثقة.</p><Link href="/providers" className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-[10px] font-black text-primary-foreground">استعرض المهنيين <ChevronLeft className="h-3.5 w-3.5" /></Link></div><div className="absolute -left-5 -bottom-10 flex h-32 w-32 items-center justify-center rounded-full bg-accent/20"><ShieldCheck className="h-16 w-16 text-accent/60" /></div>
        </section>

        {featuredAdvertisements.length > 0 && <section><div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-accent/15 px-2 py-1 text-[10px] font-bold text-accent-foreground">إعلانات مدفوعة</span><h2 className="text-[16px] font-black">مهنيون مميزون</h2></div><div className="space-y-2.5">{featuredAdvertisements.slice(0, 3).map((ad) => <Link key={ad.id} href={`/providers/${ad.providerId}`}><div className="overflow-hidden rounded-[20px] border border-accent/30 bg-card shadow-sm">{ad.imageUrl && <img src={ad.imageUrl} alt="" className="h-28 w-full object-cover" />}<div className="px-4 py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black">{ad.title}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{ad.providerName || "مهني موصى به"} · {ad.city}</p></div><span className="shrink-0 rounded-full bg-accent px-2 py-1 text-[9px] font-black text-accent-foreground">إعلان</span></div>{ad.description && <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">{ad.description}</p>}</div></div></Link>)}</div></section>}

        <section><div className="mb-3 flex items-center justify-between"><Link href="/my-requests" className="flex items-center gap-1 text-[11px] font-bold text-primary">عرض الكل <ChevronLeft className="h-3.5 w-3.5" /></Link><div className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /><h2 className="text-[16px] font-black">آخر طلباتك</h2></div></div>{recentRequests.length ? <div className="space-y-2.5">{recentRequests.map((request) => <Link key={request.id} href={`/my-requests/${request.id}`}><div className="flex items-center gap-3 rounded-[18px] border border-border bg-card px-4 py-3 shadow-sm"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-[10px] font-black text-primary">{request.isImmediate ? "عاجل" : "طلب"}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{request.serviceType}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{user?.role === "provider" ? request.clientName : request.providerName || "بانتظار المهني"}</p></div><span className="shrink-0 rounded-full bg-accent/15 px-2 py-1 text-[10px] font-bold text-accent-foreground">{request.status === "pending" ? "قيد الانتظار" : request.status === "accepted" ? "مقبول" : request.status === "completed" ? "مكتمل" : request.status === "cancelled" ? "ملغي" : "قيد المتابعة"}</span></div></Link>)}</div> : <button type="button" onClick={() => navigate("/providers")} className="flex w-full items-center justify-between rounded-[18px] border border-dashed border-border bg-card px-4 py-4 text-right"><span><span className="block text-sm font-black">لا توجد طلبات محفوظة</span><span className="mt-1 block text-[11px] text-muted-foreground">ابدأ الآن باختيار خدمة أو مهني مناسب.</span></span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground"><ArrowLeft className="h-5 w-5" /></span></button>}</section>
      </main>
    </div>
  );
}
