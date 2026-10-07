import { useState } from "react";
import { useListProviders, useListCategories } from "@/lib/api-client-react";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Zap,
  RefreshCw,
} from "lucide-react";
import { CitySelector } from "@/components/city-selector";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

export default function Providers() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("categoryId")
    ? parseInt(searchParams.get("categoryId")!)
    : null;
  const initialSearch = searchParams.get("search") || "";
  const initialSpecialty = searchParams.get("specialty") || "";

  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState<number | null>(
    initialCategory
  );
  const [filterSpecialty, setFilterSpecialty] = useState(initialSpecialty);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);

  const { data: categories } = useListCategories();
  const {
    data: providersPage,
    isLoading,
    isError,
    refetch,
  } = useListProviders(
    {
      categoryId: activeCategory ?? undefined,
      search: search || undefined,
      specialty: filterSpecialty || undefined,
      city: filterCity || undefined,
    },
    {
      query: {
        queryKey: [
          "providers",
          activeCategory,
          search,
          filterSpecialty,
          filterCity,
          filterAvailable,
          filterVerified,
        ],
        // تحديث دوري خفيف حتى يظهر اعتماد لوحة التحكم للعملاء دون إعادة فتح التطبيق.
        refetchInterval: 15000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    }
  );

  const providers = providersPage?.providers ?? [];
  const filtered = providers
    .filter(p => !filterVerified || p.isVerified)
    .filter(p => !filterAvailable || p.isAvailable);

  const hasActiveFilters =
    filterCity || filterSpecialty || filterAvailable || filterVerified;

  return (
    <div className="min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="content" className="app-stage premium-surface">
        <PageHeading
          eyebrow="دليل فزعة"
          title="استعرض المهنيين"
          description="اعثر على مهني موثوق قريب منك، واختر الخدمة التي تناسب احتياجك بثقة."
          action={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`mt-1 h-11 w-11 rounded-2xl border-primary/15 bg-card shadow-sm ${showFilters || hasActiveFilters ? "text-primary ring-2 ring-accent/25" : "text-muted-foreground"}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-label={showFilters ? "إخفاء الفلاتر" : "إظهار الفلاتر"}
              aria-pressed={showFilters}
            >
              <SlidersHorizontal className="h-5 w-5" />
              {hasActiveFilters && (
                <span className="absolute mt-[-1.25rem] mr-[-1.25rem] h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
              )}
            </Button>
          }
        />

        <SurfaceCard className="mb-7 overflow-hidden border-primary/10 bg-card/95">
          <div className="gradient-primary relative overflow-hidden px-5 py-5 text-primary-foreground sm:px-7">
            <div
              className="absolute -left-10 -top-14 h-36 w-36 rounded-full bg-accent/15 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white/65">بحث سريع</p>
                  <p className="mt-1 text-sm font-medium text-white/90">
                    ما الخدمة التي تحتاجها اليوم؟
                  </p>
                </div>
                <Search className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <div className="relative">
                <Search
                  className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="ابحث عن مهني أو خدمة..."
                  className="h-14 rounded-2xl border-0 bg-background pr-12 pl-4 text-sm text-foreground shadow-lg placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="ابحث عن مهني أو خدمة"
                />
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border bg-background/60"
              >
                <div className="space-y-4 px-5 py-5 sm:px-7">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CitySelector
                      value={filterCity}
                      onChange={setFilterCity}
                      placeholder="جميع المحافظات"
                    />
                    <Input
                      value={filterSpecialty}
                      onChange={e => setFilterSpecialty(e.target.value)}
                      placeholder="التخصص الدقيق، مثل: تمديدات أو صيانة"
                      className="h-12 rounded-xl bg-card"
                      aria-label="التخصص الدقيق"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setFilterAvailable(!filterAvailable)}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${
                        filterAvailable
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-border bg-card text-foreground hover:border-primary/30"
                      }`}
                      aria-pressed={filterAvailable}
                    >
                      <Zap
                        className={`h-4 w-4 ${filterAvailable ? "fill-green-500 text-green-500" : ""}`}
                      />
                      متاح الآن
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterVerified(!filterVerified)}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${
                        filterVerified
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/30"
                      }`}
                      aria-pressed={filterVerified}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${filterVerified ? "fill-primary/20 text-primary" : ""}`}
                      />
                      موثقون فقط
                    </button>
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCity("");
                        setFilterSpecialty("");
                        setFilterAvailable(false);
                        setFilterVerified(false);
                      }}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/25 text-sm font-bold text-destructive transition-colors hover:bg-destructive/5"
                    >
                      <X className="h-4 w-4" />
                      إزالة الفلاتر
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SurfaceCard>

        <section aria-labelledby="provider-categories">
          <SectionHeading
            title="تصفح حسب الخدمة"
            description="اختر تصنيفًا للوصول إلى المهني المناسب بسرعة."
            className="mb-3"
          />
          <div
            id="provider-categories"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-5 scrollbar-hide"
            role="tablist"
            aria-label="تصنيفات المهنيين"
          >
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`min-h-11 shrink-0 rounded-full border px-5 text-sm font-bold transition-colors ${
                activeCategory === null
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/15"
                  : "border-border bg-card text-foreground hover:border-primary/30"
              }`}
              role="tab"
              aria-selected={activeCategory === null}
            >
              الكل
            </button>
            {(categories ?? []).map(cat => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${
                  activeCategory === cat.id
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/15"
                    : "border-border bg-card text-foreground hover:border-primary/30"
                }`}
                role="tab"
                aria-selected={activeCategory === cat.id}
              >
                <span aria-hidden="true">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-foreground">
              {isLoading ? "جاري البحث..." : `${filtered.length} مهني`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              نتائج مناسبة لاحتياجك
            </p>
          </div>
          {hasActiveFilters && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              فلاتر مفعّلة
            </span>
          )}
        </div>

        {isError ? (
          <EmptyState
            icon={RefreshCw}
            title="تعذر تحميل المهنيين"
            description="حدث خلل مؤقت في الاتصال. جرّب إعادة المحاولة دون مغادرة الصفحة."
            action={
              <Button
                type="button"
                onClick={() => refetch()}
                className="min-h-11 rounded-xl"
              >
                <RefreshCw className="ml-2 h-4 w-4" /> إعادة المحاولة
              </Button>
            }
          />
        ) : isLoading ? (
          <div
            className="space-y-4"
            aria-label="جاري تحميل المهنيين"
            aria-busy="true"
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-3xl border border-border/60 bg-card/70"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="لا توجد نتائج"
            description="جرّب تغيير كلمات البحث أو اختيار تصنيف مختلف للعثور على مهني مناسب."
          />
        ) : (
          <div className="space-y-4">
            {filtered.map(p => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </AppPage>
    </div>
  );
}
