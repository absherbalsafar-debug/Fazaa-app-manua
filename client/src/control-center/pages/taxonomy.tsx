import { useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronDown,
  FolderTree,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/auth";

type Taxonomy = {
  id: number;
  name: string;
  icon: string;
  specializations: Array<{
    id: number;
    name: string;
    isActive: boolean;
    services: Array<{ id: number; name: string; isActive: boolean }>;
  }>;
};
export default function AdminTaxonomy() {
  const [items, setItems] = useState<Taxonomy[]>([]);
  const [category, setCategory] = useState("");
  const [specialization, setSpecialization] = useState<Record<number, string>>(
    {}
  );
  const [service, setService] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const load = () => {
    setLoading(true);
    setError("");
    apiRequest("/taxonomy")
      .then(setItems)
      .catch(e => {
        const message =
          e instanceof Error ? e.message : "حاول مرة أخرى بعد قليل";
        setError(message);
        toast({
          title: "تعذر تحميل التصنيفات",
          description: message,
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  const create = async (path: string, body: object) => {
    try {
      await apiRequest(path, { method: "POST", body: JSON.stringify(body) });
      toast({ title: "تمت الإضافة" });
      load();
    } catch (e) {
      toast({
        title: "تعذر الحفظ",
        description: e instanceof Error ? e.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };
  const addCategory = () => {
    const value = category.trim();
    if (value) create("/categories", { name: value, icon: "🔧" });
    setCategory("");
  };
  const addSpecialization = (categoryId: number) => {
    const value = specialization[categoryId]?.trim();
    if (value) create("/admin/specializations", { categoryId, name: value });
  };
  const addService = (specializationId: number) => {
    const value = service[specializationId]?.trim();
    if (value) create("/admin/services", { specializationId, name: value });
  };

  return (
    <AppPage width="wide" className="space-y-7">
      <PageHeading
        eyebrow="مركز الإدارة / هيكل الخدمات"
        title="إدارة التخصصات والمهن"
        description="أضف وعدّل الأقسام والتخصصات والخدمات دون تحديث التطبيق."
        action={
          <Button
            variant="outline"
            className="min-h-11 rounded-xl"
            onClick={load}
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            تحديث
          </Button>
        }
      />

      <SurfaceCard className="p-5 sm:p-6">
        <SectionHeading
          title="إضافة قسم جديد"
          description="ابدأ بقسم رئيسي ثم أضف التخصصات والخدمات التابعة له."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            className="min-h-11 rounded-xl"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="اسم قسم جديد"
            aria-label="اسم قسم جديد"
            onKeyDown={e => {
              if (e.key === "Enter") addCategory();
            }}
          />
          <Button
            className="min-h-11 shrink-0 rounded-xl sm:px-5"
            onClick={addCategory}
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة قسم
          </Button>
        </div>
      </SurfaceCard>

      <section>
        <SectionHeading
          title="هيكل الخدمات"
          description={
            items.length
              ? `${items.length} أقسام نشطة في المنصة`
              : "نظّم الخدمات في طبقات واضحة وسهلة الإدارة"
          }
        />
        {loading ? (
          <SurfaceCard className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-center">
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
            <p className="text-sm font-bold text-muted-foreground">
              جارٍ تحميل التصنيفات…
            </p>
          </SurfaceCard>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="تعذر تحميل التصنيفات"
            description={error}
            action={
              <Button className="min-h-11 rounded-xl" onClick={load}>
                <RefreshCw className="ml-2 h-4 w-4" />
                المحاولة مجددًا
              </Button>
            }
          />
        ) : !items.length ? (
          <EmptyState
            icon={FolderTree}
            title="لا توجد أقسام بعد"
            description="أضف أول قسم من النموذج أعلاه، ثم أنشئ التخصصات والخدمات التابعة له."
          />
        ) : (
          <div className="grid gap-5 2xl:grid-cols-2">
            {items.map(item => (
              <SurfaceCard key={item.id} className="overflow-hidden p-0">
                <div className="border-b border-border/70 bg-gradient-to-l from-primary/[0.06] to-card p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl text-primary-foreground">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.specializations.length} تخصصات ·{" "}
                          {item.specializations.reduce(
                            (total, spec) => total + spec.services.length,
                            0
                          )}{" "}
                          خدمات
                        </p>
                      </div>
                    </div>
                    <BriefcaseBusiness
                      className="h-5 w-5 shrink-0 text-primary/45"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Input
                      className="min-h-11 rounded-xl bg-background/80"
                      value={specialization[item.id] ?? ""}
                      onChange={e =>
                        setSpecialization(old => ({
                          ...old,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="تخصص جديد داخل القسم"
                      aria-label={`تخصص جديد داخل ${item.name}`}
                      onKeyDown={e => {
                        if (e.key === "Enter") addSpecialization(item.id);
                      }}
                    />
                    <Button
                      variant="secondary"
                      className="min-h-11 shrink-0 rounded-xl"
                      onClick={() => addSpecialization(item.id)}
                    >
                      <Plus className="ml-1 h-4 w-4" />
                      إضافة تخصص
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 p-4 sm:p-5">
                  {!item.specializations.length ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      لا توجد تخصصات في هذا القسم بعد.
                    </div>
                  ) : (
                    item.specializations.map(spec => (
                      <div
                        key={spec.id}
                        className="rounded-2xl border border-border/80 bg-muted/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                              <Layers3 className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-extrabold">{spec.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {spec.services.length} خدمات
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700"
                          >
                            {spec.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {spec.services.length ? (
                            spec.services.map(itemService => (
                              <span
                                key={itemService.id}
                                className={`inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-bold ${itemService.isActive ? "border-border text-foreground" : "border-border/60 text-muted-foreground line-through"}`}
                              >
                                <Wrench className="h-3.5 w-3.5 text-primary/65" />
                                {itemService.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              لا توجد خدمات مضافة
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Input
                            className="min-h-11 rounded-xl bg-background"
                            value={service[spec.id] ?? ""}
                            onChange={e =>
                              setService(old => ({
                                ...old,
                                [spec.id]: e.target.value,
                              }))
                            }
                            placeholder="خدمة جديدة"
                            aria-label={`خدمة جديدة في ${spec.name}`}
                            onKeyDown={e => {
                              if (e.key === "Enter") addService(spec.id);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-11 shrink-0 rounded-xl"
                            onClick={() => addService(spec.id)}
                          >
                            <Plus className="ml-1 h-4 w-4" />
                            إضافة خدمة
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
                  <ChevronDown className="h-4 w-4 text-primary/60" />
                  تظهر التغييرات مباشرة في التطبيق بعد الإضافة
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>
    </AppPage>
  );
}
