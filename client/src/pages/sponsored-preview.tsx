import { useEffect, type ReactNode } from "react";
import {
  ArrowRight,
  Eye,
  Megaphone,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { useListFeaturedAdvertisements } from "@/lib/api-client-react";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

function SponsoredBadge({ vip = false }: { vip?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${vip ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}
    >
      <Sparkles className="h-3 w-3" />
      {vip ? "إعلان VIP" : "إعلان ممول"}
    </span>
  );
}
function track(id: number, event: string) {
  void fetch(`/api/ads/${id}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  });
}

export default function SponsoredPreview() {
  const { data: ads = [], isLoading } = useListFeaturedAdvertisements();
  const previewAds = ads.slice(0, 6);
  useEffect(() => {
    previewAds.forEach(ad => track(ad.id, "impression"));
  }, [previewAds.map(ad => ad.id).join(",")]);

  return (
    <main className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <header className="border-b border-border bg-background/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:text-primary"
            aria-label="العودة للرئيسية"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-bold text-muted-foreground">
              معاينة داخل تطبيق العميل
            </p>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              الإعلانات الممولة
            </h1>
          </div>
        </div>
      </header>
      <AppPage width="content" className="space-y-7">
        <PageHeading
          eyebrow="ظهور شفاف وواضح"
          title="معاينة الظهور المدفوع"
          description="إعلانات بارزة ومريحة للعين، مع شارة واضحة حتى تبقى تجربة البحث شفافة للعميل."
        />
        <SurfaceCard className="border-primary/10 bg-primary p-5 text-primary-foreground shadow-[0_16px_34px_rgba(24,45,83,0.16)] sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">
                إعلانات موثوقة داخل التجربة
              </h2>
              <p className="mt-1 text-xs leading-6 text-white/70">
                تظهر الإعلانات في أماكنها بوضوح، وتبقى أدوات التواصل متاحة
                للعميل من دون إرباك.
              </p>
            </div>
          </div>
        </SurfaceCard>
        <PreviewSection title="مهنيون مميزون" label="الصفحة الرئيسية">
          <div className="grid gap-3 sm:grid-cols-2">
            {isLoading ? (
              <Loading />
            ) : previewAds.length === 0 ? (
              <Empty text="لا توجد إعلانات نشطة حاليًا." />
            ) : (
              previewAds
                .slice(0, 2)
                .map(ad => <AdCard key={`home-${ad.id}`} ad={ad} large />)
            )}
          </div>
        </PreviewSection>
        <PreviewSection title="إعلان بين النتائج" label="نتائج البحث">
          <div className="space-y-2">
            {isLoading ? (
              <Loading />
            ) : previewAds.length === 0 ? (
              <Empty text="ستظهر الإعلانات المعتمدة بين نتائج البحث." />
            ) : (
              previewAds
                .slice(0, 3)
                .map(ad => <AdRow key={`search-${ad.id}`} ad={ad} />)
            )}
          </div>
        </PreviewSection>
        <PreviewSection title="ظهور داخل القسم" label="صفحة التخصص">
          <SurfaceCard className="border-accent/35 bg-accent/[0.06] p-3 sm:p-4">
            {isLoading ? (
              <Loading />
            ) : previewAds[0] ? (
              <AdCard ad={previewAds[0]} />
            ) : (
              <Empty text="ستظهر المعاينة عند اعتماد أول إعلان." />
            )}
          </SurfaceCard>
        </PreviewSection>
        <div className="flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-6 text-primary">
          <Eye className="mt-1 h-4 w-4 shrink-0" />
          يتم تسجيل الظهور والنقر والاتصال وواتساب لتمكين المهني من قياس أثر
          الإعلان.
        </div>
      </AppPage>
    </main>
  );
}
function PreviewSection({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <SectionHeading title={title} className="mb-0" />
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-black text-accent-foreground">
          {label}
        </span>
      </div>
      {children}
    </section>
  );
}
function Loading() {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-border bg-card/70 text-xs font-bold text-muted-foreground">
      <span className="animate-pulse">جاري تحميل الإعلانات...</span>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <EmptyState
      icon={Megaphone}
      title={text}
      className="min-h-28 rounded-2xl py-7"
    />
  );
}
function AdCard({ ad, large = false }: { ad: any; large?: boolean }) {
  const vip = ad.plan === "vip";
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${vip ? "border-primary/45" : "border-accent/45"} ${large ? "sm:min-h-[245px]" : ""}`}
    >
      <div className="relative">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt=""
            className={`${large ? "h-36 sm:h-40" : "h-28"} w-full object-cover`}
          />
        ) : (
          <div
            className={`${large ? "h-36 sm:h-40" : "h-24"} flex items-center justify-center bg-gradient-to-l from-accent/20 to-primary/5`}
          >
            <Megaphone className="h-8 w-8 text-accent" />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <SponsoredBadge vip={vip} />
        </div>
      </div>
      <div className="p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-foreground">
            {ad.title}
          </p>
          <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <span>{ad.providerName || "مهني موصى به"}</span>
            {ad.city && (
              <>
                <span>·</span>
                <MapPin className="h-3 w-3" />
                {ad.city}
              </>
            )}
          </p>
        </div>
        {ad.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {ad.description}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/providers/${ad.providerId}`}
            onClick={() => track(ad.id, "click")}
            className="flex min-h-10 flex-1 items-center justify-center rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground"
          >
            عرض الملف
          </Link>
          {ad.providerPhone && (
            <a
              href={`tel:${ad.providerPhone}`}
              onClick={() => track(ad.id, "call")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700"
              aria-label="اتصال"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
          {ad.providerPhone && (
            <a
              href={`https://wa.me/${String(ad.providerPhone)
                .replace(/[^0-9+]/g, "")
                .replace(/^\+/, "")}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => track(ad.id, "whatsapp")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xs font-black text-emerald-700"
              aria-label="واتساب"
            >
              W
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
function AdRow({ ad }: { ad: any }) {
  return (
    <article className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-accent/45 bg-card p-3 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent/15 text-accent-foreground">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Megaphone className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-foreground">
          {ad.title}
        </p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {ad.providerName || "مهني موصى به"} ·{" "}
          {ad.categoryName || "خدمات متنوعة"}
        </p>
      </div>
      <SponsoredBadge vip={ad.plan === "vip"} />
    </article>
  );
}
